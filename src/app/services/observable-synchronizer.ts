import { Observable, of, Subject, throwError } from 'rxjs';
import { catchError, concatMap, filter, map, take, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface IMyWrappedObservable {
  observable: Observable<any>;
  progressCallback?: (msg) => void;
  id?: string;
}

interface IWrappedResult {
  result: any;
  error?: any;
  id: string;
}

class ObservableSynchronizer {

  private queueCount = 0;

  private executionQueueSubject: Subject<IMyWrappedObservable> = new Subject<IMyWrappedObservable>();
  private executionQueue$: Observable<IMyWrappedObservable> = this.executionQueueSubject.asObservable();

  private resultsSubject: Subject<IWrappedResult> = new Subject();
  private results$: Observable<IWrappedResult> = this.resultsSubject.asObservable();

  constructor() {

    this.executionQueue$.pipe(
      tap((o: IMyWrappedObservable) => {
        this.queueCount += 1;

        if (this.queueCount > 1) {
          o.progressCallback && o.progressCallback('queue');
        }
      }),
      concatMap(
        (o: IMyWrappedObservable) => {

          return o.observable.pipe(
            map((result: any): IWrappedResult => {
              return { result, id: o.id };
            }),
            catchError((e: any) => {
              return of({
                result: '',
                id: o.id,
                error: e
              });
            }),

            take(1) // TODO: Be careful - source observable should decide on completeness, so we might need to replace this with last operator
          );
        }
      )
    ).subscribe((doneObservable: IWrappedResult) => {
      this.queueCount -= 1;
      this.resultsSubject.next(doneObservable);
    });

  }

  public execute<T>(o: IMyWrappedObservable): Observable<T> {
    const id = uuidv4();
    o.id = id;
    this.executionQueueSubject.next(o);

    return this.results$.pipe(
      filter((doneObservable: IWrappedResult) => doneObservable.id === id),
      map((wResult: IWrappedResult): T => {
        if (wResult.error) {
          throwError(wResult.error);
        }
        return wResult.result;
      }),
    );
  }

}

export const TransactionSynchronizer = new ObservableSynchronizer();
