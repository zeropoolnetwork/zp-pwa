import { Observable, Subject } from 'rxjs';
import { concatMap, filter, map, take, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface ScheduledObservable {
  observable: Observable<any>;
  progressCallback?: (msg) => void;
  id?: string;
}

interface DoneObservable {
  result: any;
  id: string;
}

export class ObservableSynchronizer {

  private queueCount = 0;

  private queue: Subject<ScheduledObservable> = new Subject<ScheduledObservable>();
  private queue$: Observable<ScheduledObservable> = this.queue.asObservable();

  private doneObservable: Subject<DoneObservable> = new Subject();
  private doneObservable$: Observable<DoneObservable> = this.doneObservable.asObservable();

  constructor() {

    this.queue$.pipe(
      tap((o: ScheduledObservable) => {
        this.queueCount += 1;

        if (this.queueCount > 1) {
          o.progressCallback && o.progressCallback('queue');
        }
      }),
      concatMap(
        (o: ScheduledObservable) => {

          return o.observable.pipe(
            map((result: any): DoneObservable => {
              return { result, id: o.id };
            }),
            take(1)
          );
        }
      )
    ).subscribe((doneObservable: DoneObservable) => {
      this.queueCount -= 1;
      this.doneObservable.next(doneObservable);
    });

  }

  public execute<T>(o: ScheduledObservable): Observable<T> {
    const id = uuidv4();
    o.id = id;
    this.queue.next(o);
    return this.doneObservable$.pipe(
      filter((doneObservable: DoneObservable) => doneObservable.id === id),
      map((doneObservable: DoneObservable): T => {
        return doneObservable.result;
      })
    );
  }

}
