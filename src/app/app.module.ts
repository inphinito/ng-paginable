import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { NbTableSorterModule } from './modules/nb-table-sorter/nb-table-sorter.module';
import { HttpClientModule } from '@angular/common/http';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
	{ path: '', loadChildren: () => import('./examples/examples.module').then(m => m.ExamplesModule) },
];

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule,
		NbTableSorterModule.forRoot({
			mapping: {
				currentPage: 'currentPage',
				lastPage: 'lastPage',
			}
		}),
		HttpClientModule,
		RouterModule.forRoot(routes)
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
