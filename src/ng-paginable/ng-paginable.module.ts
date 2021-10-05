import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NbTableSorterPaginatorComponent } from './components/nb-table-sorter-paginator/nb-table-sorter-paginator.component';
import { GetPipe } from './pipes/get.pipe';
import { IsObjectPipe } from './pipes/is-object.pipe';
import { IsStringPipe } from './pipes/is-string.pipe';
import { NbTableSorterHeaderDirective } from './directives/nb-table-sorter-header.directive';
import { NbTableSorterNotFoundDirective } from './directives/nb-table-sorter-not-found.directive';
import { NbTableSorterRowDirective } from './directives/nb-table-sorter-row.directive';
import { TableSorterComponent } from './components/nb-table-sorter/table-sorter.component';
import { UcfirstPipe } from './pipes/ucfirst.pipe';
import { NbTableSorterCellDirective } from './directives/nb-table-sorter-cell.directive';
import { NbTableSorterService } from './services/nb-table-sorter.service';
import { NbTableSorterConfig } from './interfaces/nb-table-sorter-config';
import { NbTableSorterConfigService } from './services/nb-table-sorter-config.service';
import { NbTableSorterExpandingRowDirective } from './directives/nb-table-sorter-expanding-row.directive';
import { TranslateModule } from '@ngx-translate/core';
import { NbTableSorterDropdownComponent } from './components/nb-table-sorter-dropdown/nb-table-sorter-dropdown.component';
import { ResizableDirective } from './directives/resizable.directive';
import { ResizableComponent } from './components/resizable/resizable.component';
import { NbTableSorterLoadingDirective } from './directives/nb-table-sorter-loading.directive';
import { NbTableSorterErrorDirective } from './directives/nb-table-sorter-error.directive';
import { NgTableSorterRangeInputComponent } from './components/ng-table-sorter-range-input/ng-table-sorter-range-input.component';
import { NbTableSorterFilterDirective } from './directives/nb-table-sorter-filter.directive';
import { IsObservablePipe } from './pipes/is-observable.pipe';
import { ViewSelectorComponent } from './components/view-selector/view-selector.component';
import { TooltipDirective } from './directives/tooltip.directive';
import { ModalComponent } from './components/modal/modal.component';
import { TypeaheadModule } from './modules/typeahead/typeahead.module';

@NgModule({
	declarations: [
		TableSorterComponent,
		NbTableSorterPaginatorComponent,
		NbTableSorterHeaderDirective,
		NbTableSorterRowDirective,
		NbTableSorterCellDirective,
		NbTableSorterNotFoundDirective,
		NbTableSorterLoadingDirective,
		NbTableSorterExpandingRowDirective,
		GetPipe,
		IsObjectPipe,
		UcfirstPipe,
		IsStringPipe,
		NbTableSorterDropdownComponent,
		ResizableComponent,
		ResizableDirective,
		NbTableSorterErrorDirective,
		NgTableSorterRangeInputComponent,
		NbTableSorterFilterDirective,
		IsObservablePipe,
		ViewSelectorComponent,
		TooltipDirective,
		ModalComponent
	],
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		TranslateModule.forChild(),
		TypeaheadModule
	],
	exports: [
		TableSorterComponent,
		NbTableSorterPaginatorComponent,
		NbTableSorterHeaderDirective,
		NbTableSorterRowDirective,
		NbTableSorterCellDirective,
		NbTableSorterNotFoundDirective,
		NbTableSorterLoadingDirective,
		NbTableSorterErrorDirective,
		NbTableSorterExpandingRowDirective,
		NbTableSorterFilterDirective,
		ResizableDirective,
		GetPipe,
		IsObjectPipe,
		UcfirstPipe,
		IsStringPipe,
		IsObservablePipe,
		ResizableComponent,
		NbTableSorterErrorDirective,
		NgTableSorterRangeInputComponent,
		ViewSelectorComponent,
		TooltipDirective,
		ModalComponent
	],
	entryComponents: [
		TableSorterComponent
	]
})
export class NbTableSorterModule {

	static forRoot(config?: NbTableSorterConfig): ModuleWithProviders<NbTableSorterModule> {
		return {
			ngModule: NbTableSorterModule,
			providers: [
				NbTableSorterService,
				{
					provide: NbTableSorterConfigService,
					useValue: config
				}
			]
		};
	}
}