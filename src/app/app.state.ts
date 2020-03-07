import { Action, State, StateContext } from '@ngxs/store';

export interface AppStateModel {
  title: string;
  isCompleted: boolean;
}

// Actions
export class AddTodo {
  static readonly type = '[Todo] Add';

  constructor(public payload: any) {
  }
}

@State<AppStateModel>({
  name: 'todos',
  defaults: {
    title: '',
    isCompleted: false
  }
})
class TodosState {


  @Action(AddTodo)
  add(ctx: StateContext<AppStateModel>, action: AddTodo): void {
    ctx.setState((prevState: AppStateModel) =>
      prevState.concat({
        title: action.title,
        isCompleted: false
      })
    );
  }


  @Action(AddTodo)
  add2( {patchState, dispatch, setState, getState}: StateContext<AppStateModel>, action: AddTodo): void {

    patchState({title: ''});

    // patchState.setState((state: AppStateModel) =>
    //   state.concat({
    //     title: action.title,
    //     isCompleted: false
    //   })
    // );
  }
}
