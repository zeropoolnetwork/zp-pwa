import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';


// const routes: Routes = [];
// const routes: Routes = [{ path: 'main', component: MainComponent }];
const routes: Routes = [{ path: 'main', loadChildren: () => import('./main/main.module').then(m => m.MainModule) }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
