import { animate, style, transition, trigger } from '@angular/animations';
import { Component, ContentChild, ContentChildren, EventEmitter, forwardRef, Input, OnDestroy, Output, QueryList, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { get } from 'lodash';
import { isObservable, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, map, startWith, tap } from 'rxjs/operators';
import { locale as enLang } from '../../assets/i18n/en';
import { locale as esLang } from '../../assets/i18n/es';
import { BREAKPOINTS } from '../../constants/breakpoints';
import { NbTableSorterCellDirective } from '../../directives/nb-table-sorter-cell.directive';
import { NbTableSorterErrorDirective } from '../../directives/nb-table-sorter-error.directive';
import { NbTableSorterExpandingRowDirective } from '../../directives/nb-table-sorter-expanding-row.directive';
import { NbTableSorterFilterDirective } from '../../directives/nb-table-sorter-filter.directive';
import { NbTableSorterLoadingDirective } from '../../directives/nb-table-sorter-loading.directive';
import { NbTableSorterNotFoundDirective } from '../../directives/nb-table-sorter-not-found.directive';
import { NbTableSorterRowDirective } from '../../directives/nb-table-sorter-row.directive';
import { NbTableSorterButton } from '../../interfaces/nb-table-sorter-button';
import { NbTableSorterDropdown } from '../../interfaces/nb-table-sorter-dropdown';
import { NbTableSorterHeader } from '../../interfaces/nb-table-sorter-header';
import { NbTableSorterItem } from '../../interfaces/nb-table-sorter-item';
import { NbTableSorterOptions } from '../../interfaces/nb-table-sorter-options';
import { NbTableSorterOrdination } from '../../interfaces/nb-table-sorter-ordination';
import { NbTableSorterPagination } from '../../interfaces/nb-table-sorter-pagination';
import { NbTableSorterRowAction } from '../../interfaces/nb-table-sorter-row-action';
import { View } from '../../interfaces/view';
import { NbTableSorterService } from '../../services/nb-table-sorter.service';
import { PaginationService } from '../../services/pagination.service';
import { TranslationService } from '../../services/translation.service';
import { ViewSelectorComponent } from '../view-selector/view-selector.component';

@Component({
	selector: 'table-sorter',
	templateUrl: './table-sorter.component.html',
	styleUrls: ['./table-sorter.component.scss'],
	animations: [
		trigger('fadeInOut', [
			transition(':enter', [
				style({ opacity: 0 }),
				animate('256ms 256ms', style({ opacity: 1, height: 'auto' })),
			]),
			transition(':leave', [
				animate('256ms ease-out', style({ opacity: 0, height: '0' })),
			])
		]),
	],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => TableSorterComponent),
			multi: true
		}
	]
})
export class TableSorterComponent implements OnDestroy {

	@Input() id?: string;
	private _headers: NbTableSorterHeader[] | string[];

	@Input() showSearchInput: boolean = true;
	@Input() options: NbTableSorterOptions = {
		cursor: 'default',
		hoverableRows: false
	};

	loading: boolean = false;
	errorOcurred: boolean = false;

	/**
	 * Table headers
	 *
	 * @readonly
	 * @type {(NbTableSorterHeader[] | string[])}
	 * @memberof TableSorterComponent
	 */
	@Input()
	get headers(): NbTableSorterHeader[] | string[] {
		if (!this._headers) {
			if (this._rows.length) {
				this._headers = Object.keys(this._rows[0]);
			} else {
				this._headers = [];
			}
		}
		return this._headers;
	}
	set headers(v: NbTableSorterHeader[] | string[]) {
		this._headers = v;

		// Parsing headers
		for (const header of this._headers) {
			if (header.constructor.name === 'Object' && (header as NbTableSorterHeader).buttons && !(header as NbTableSorterHeader).property) {
				Object.assign(header, { wrapping: 'nowrap', onlyButtons: true, align: 'end' }, header);
			}
		}
		this._initializeFilterForm();
	}

	get lastColumnOnlyHasButtons() {
		const lastHeader = this._headers[this._headers.length - 1];
		return lastHeader.constructor.name === 'Object' && (lastHeader as NbTableSorterHeader).buttons && !(lastHeader as NbTableSorterHeader).property;
	}

	data: NbTableSorterPagination;

	/**
	 * Items paginated
	 *
	 * @private
	 * @type {NbTableSorterPagination}
	 * @memberof TableSorterComponent
	 */
	private _pagination: NbTableSorterPagination;
	@Input()
	get pagination(): NbTableSorterPagination | Observable<NbTableSorterPagination> {
		return this._pagination;
	}
	set pagination(v: NbTableSorterPagination | Observable<NbTableSorterPagination>) {
		if (!v) {
			this.data = null;
		} else if (isObservable(v)) {
			(v as Observable<NbTableSorterPagination>).pipe(
				map((value: NbTableSorterPagination) => ({ loading: false, error: false, value: value })),
				startWith({ loading: true, error: false, value: null }),
				catchError(error => of({ loading: false, error, value: null })),
				map(o => {
					this.loading = !!o.loading;
					this.errorOcurred = o.error;
					return o.value;
				})
			).subscribe((result: NbTableSorterPagination) => {
				this.data = result;
			});
		} else {
			this.data = v as NbTableSorterPagination;
		}
		this.allRowsSelected = false;
		if (this.selectable || this.batchActions?.length) {
			this.markSelected();
		}
	}

	/**
	 * Items not paginated
	 *
	 * @private
	 * @type {any[]}
	 * @memberof TableSorterComponent
	 */
	private _rows: any[];
	@Input()
	get rows(): any[] {
		return this._rows;
	}
	set rows(v: any[]) {
		this._rows = v;
		const params = {
			page: 1,
			ordination: this.ordination,
			searchText: this.searchText,
			searchKeys: this.searchKeys,
			paginate: this.paginate
		};
		this.data = this.rows ? this._paginationSvc.generate(this.rows, params) : null;
		this.allRowsSelected = false;
		if (this.selectable || this.batchActions?.length) {
			this.markSelected();
		}
	}

	/**
	 * Collection of selected rows
	 *
	 * @type {any[]}
	 * @memberof TableSorterComponent
	 */
	selectedItems: any[] = [];

	/**
	 * Set whether all page rows are selecteds
	 *
	 * @type {boolean}
	 * @memberof TableSorterComponent
	 */
	allRowsSelected: boolean = false;

	/**
	 * Set whether the rows are selectable
	 *
	 * @type {boolean}
	 * @memberof TableSorterComponent
	 */
	@Input() selectable: boolean = false;

	/**
	 * If set, it will be the property returned in the onSelected event
	 *
	 * @type {string}
	 * @memberof TableSorterComponent
	 */
	@Input() selectableProperty: string;

	/**
	 * Event triggered when a row or multiples rows are selected or unselected
	 *
	 * @memberof TableSorterComponent
	 */
	@Output() onSelected = new EventEmitter<any>();

	/**
	 * Pagination position
	 *
	 * @type {('bottom' | 'top' | 'both')}
	 * @memberof TableSorterComponent
	 */
	@Input() paginationPosition: 'bottom' | 'top' | 'both' = 'bottom';

	@Input() paginationInfo: boolean = true;

	searchText: string = '';
	@Input() searchKeys: string[] = ['name'];

	ordination: NbTableSorterOrdination = null;

	/**
	 * Collection of actions for items
	 *
	 * @type {NbTableSorterRowAction[]}
	 * @memberof TableSorterComponent
	 */
	@Input() actions: NbTableSorterRowAction[] = [];

	/**
	 * Collection of actions for items
	 *
	 * @type {NbTableSorterRowAction[]}
	 * @memberof TableSorterComponent
	 */
	private _batchActions: Array<NbTableSorterDropdown | NbTableSorterButton> = [];
	@Input()
	get batchActions(): Array<NbTableSorterDropdown | NbTableSorterButton> {
		return this._batchActions;
	}
	set batchActions(v: Array<NbTableSorterDropdown | NbTableSorterButton>) {
		this._batchActions = v.map(b => {
			if ((b as NbTableSorterDropdown).buttons) {
				b = { fill: null, position: 'left', color: 'light', ...b };
			}
			return b;
		});
	}

	batchActionsDropdown: NbTableSorterDropdown;

	batchAction: NbTableSorterButton = null;

	/**
	 * Sets the action column to sticky
	 *
	 * @type {NbTableSorterRowAction[]}
	 * @memberof TableSorterComponent
	 */
	@Input() stickyActions: boolean = true;

	/**
	 * On item click event emitter
	 *
	 * @memberof TableSorterComponent
	 */
	@Output() itemClick = new EventEmitter<any>();

	/**
	 * On page click event emitter
	 *
	 * @memberof TableSorterComponent
	 */
	@Output() onPageClick = new EventEmitter<number>();

	/**
	 * On params change event emitter
	 *
	 * @memberof TableSorterComponent
	 */
	@Output() onParamsChange = new EventEmitter<any>();

	// TODO: Put default config
	mapping: any = this._configSvc.mapping;

	/**
	 * Rows per page options
	 *
	 * @private
	 * @type {number[]}
	 * @memberof TableSorterComponent
	 */
	private _perPageOptions: number[] = [10, 20, 50, 100];
	@Input()
	get perPageOptions(): number[] {
		return this._perPageOptions;
	}
	set perPageOptions(v: number[]) {
		this._perPageOptions = v;
		this.itemsPerPage = this._perPageOptions.length ? this._perPageOptions[0] : 20;
	}

	/**
	 * Items per page
	 *
	 * @private
	 * @type {number}
	 * @memberof TableSorterComponent
	 */
	private _itemsPerPage: number = 20;
	@Input()
	get itemsPerPage(): number {
		return this._itemsPerPage;
	}
	set itemsPerPage(v: number) {
		this._itemsPerPage = +v;
		this.data.currentPage = 1;
		this.triggerTheParamChanges();
	}

	responsiveCSSClass: string = '';
	private _responsive: string;
	@Input()
	get responsive(): string {
		return this._responsive;
	}
	set responsive(v: string) {
		this._responsive = v;
		if (this._responsive && BREAKPOINTS.indexOf(this._responsive) > -1) {
			this.responsiveCSSClass = this.responsive === 'xs' ? null : ('table-responsive-' + this.responsive);
		} else {
			this.responsiveCSSClass = null;
		}
	}

	filterHeaders: NbTableSorterHeader[];

	/**
	 * Filter form
	 *
	 * @type {FormGroup}
	 * @memberof TableSorterComponent
	 */
	filterFG: FormGroup = new FormGroup({});

	/**
	 * Event triggered when a filter value changes
	 *
	 * @memberof TableSorterComponent
	 */
	@Output() filterChange = new EventEmitter<any>();

	filterFGSct: Subscription;

	filterLoading: boolean = false;

	filterTrigger$: Subject<void> = new Subject();

	/**
	 * Time to ouput the filter form value
	 *
	 * @type {number}
	 * @memberof TableSorterComponent
	 */
	@Input() debounce: number = 1024;

	disabled: boolean = false;

	/**
	 * Set if the data must be paginated
	 *
	 * @type {boolean}
	 * @memberof TableSorterComponent
	 */
	@Input() paginate: boolean = true;

	@ContentChild(NbTableSorterRowDirective, { read: TemplateRef }) templateRow: NbTableSorterRowDirective;
	@ContentChildren(NbTableSorterCellDirective) templateCells !: QueryList<NbTableSorterCellDirective>;
	@ContentChild(NbTableSorterNotFoundDirective, { read: TemplateRef }) noDataTpt: NbTableSorterNotFoundDirective;
	@ContentChild(NbTableSorterLoadingDirective, { read: TemplateRef }) loadingTpt: NbTableSorterLoadingDirective;
	@ContentChild(NbTableSorterErrorDirective, { read: TemplateRef }) errorTpt: NbTableSorterErrorDirective;
	@ContentChildren(NbTableSorterExpandingRowDirective) templateExpandingRows !: QueryList<NbTableSorterExpandingRowDirective>;
	@ContentChildren(NbTableSorterFilterDirective) filterTpts !: QueryList<NbTableSorterFilterDirective>;
	@ViewChild(ViewSelectorComponent) viewSelector: ViewSelectorComponent;

	/**
	 * Set if the view selector must be showed
	 *
	 * @type {boolean}
	 * @memberof TableSorterComponent
	 */
	@Input() showViewSelector: boolean = false;

	@Input() viewSaverForm: any;


	private _views: View[];
	@Input()
	get views(): View[] {
		return this._views;
	}
	set views(v: View[]) {
		this._views = v;
	}

	@Output() viewAdded = new EventEmitter<View | string>();
	@Output() viewEdited = new EventEmitter<View | string>();
	@Output() viewDeleted = new EventEmitter<View | string>();

	constructor(
		private _fb: FormBuilder,
		private _translationSvc: TranslationService,
		private _configSvc: NbTableSorterService,
		private _paginationSvc: PaginationService
	) {
		this._translationSvc.loadTranslations(enLang, esLang);
	}

	ngOnInit() {
		if (!this.id) {
			this.id = this._configSvc.generateIdFromUrlAndHeaders(this.headers).toString();
		}
	}

	ngOnDestroy(): void {
		this.filterFGSct?.unsubscribe();
	}

	writeValue(value: any): void {
		if (value) {
			this.selectedItems = value || [];
		} else {
			this.selectedItems = [];
		}
	}

	onChange = (_: any) => { }
	onTouch = () => { }

	registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.disabled = isDisabled;
	}

	/**
	 * Obtiene la propiedad del objeto cuya clave es pasada por parámetro
	 *
	 * @param {object} item
	 * @param {string} key
	 * @returns {*}
	 * @memberof TableSorterComponent
	 */
	getProperty(item: object, key: string): any {
		return get(item, key);
	}

	itemClicked(item: any) {
		this.itemClick.next(item);
	}

	filter() {
		this.data.currentPage = 1;
		this.triggerTheParamChanges();
	}

	pageClicked(page: number) {
		this.data.currentPage = page;
		this.triggerTheParamChanges();
	}

	/**
	 * If paging is done on the server, a parameter change subscription is launched. Otherwise,
	 * get the data sorted according to the header passed by parameter.
	 *
	 * @param {NbTableSorterHeader} header
	 * @returns {void}
	 * @memberof TableSorterComponent
	 */
	sort(header: NbTableSorterHeader): void {
		if (!header.sortable) {
			return;
		}
		if (!this.ordination || this.ordination.property !== header.property) {
			this.ordination = {
				property: header.property,
				direction: 'ASC'
			};
		} else {
			this.ordination = {
				property: header.property,
				direction: this.ordination.direction === 'ASC' ? 'DESC' : 'ASC'
			};
		}

		this.triggerTheParamChanges();
	}

	triggerTheParamChanges() {
		const params = {
			page: this.data.currentPage,
			perPage: this.itemsPerPage,
			ordination: this.ordination,
			searchText: this.searchText,
			searchKeys: this.searchKeys,
			paginate: this.paginate
		};

		Object.keys(params).forEach((k) => (params[k] == null) && delete params[k]);

		if (!this.rows) {
			this.onParamsChange.next(params);
		} else {
			this.data = this._paginationSvc.generate(this.rows, params);
		}
	}

	/**
	 * Get the ordination class
	 *
	 * @param {NbTableSorterHeader} header
	 * @returns
	 * @memberof TableSorterComponent
	 */
	getOrdenationClass(header: NbTableSorterHeader) {
		if (!this.ordination || this.ordination.property !== header.property) {
			return 'fa-sort';
		}
		return this.ordination.direction.toUpperCase() === 'ASC' ? 'fa-sort-up' : 'fa-sort-down';
	}

	/**
	 * If it exists, returns the cell template for the header passed by parameter
	 *
	 * @param {(NbTableSorterHeader)} header
	 * @returns {TemplateRef<NbTableSorterCellDirective>}
	 * @memberof TableSorterComponent
	 */
	getCellTemplate(header: NbTableSorterHeader): TemplateRef<NbTableSorterCellDirective> {
		const property = header instanceof String ? header : header.property;
		if (!property) {
			return null;
		}
		const directive = this.templateCells.find(o => o.header === property);
		return directive ? directive.template : null;
	}

	/**
	 * If it exists, returns the filter template for the header passed by parameter
	 *
	 * @param {(NbTableSorterHeader)} header
	 * @returns {TemplateRef<NbTableSorterCellDirective>}
	 * @memberof TableSorterComponent
	 */
	getFilterTemplate(header: NbTableSorterHeader): TemplateRef<NbTableSorterFilterDirective> {
		const property = header instanceof String ? header : header.property;
		if (!property) {
			return null;
		}
		const directive = this.filterTpts.find(o => o.header === property);
		return directive ? directive.template : null;
	}

	/**
	 * Handles the action to execute
	 *
	 * @param {Function} handler
	 * @param {*} item
	 * @memberof TableSorterComponent
	 */
	handleAction(event: Event, handler: (...args: any) => void, item: any) {
		event.stopPropagation();
		handler(item);
	}

	/**
	 * Handles the action to be executed in a batch
	 *
	 * @param {Event} event
	 * @memberof TableSorterComponent
	 */
	handleBatchAction(event: any) {
		event.handler(this.selectedItems);
	}

	/**
	 * Determines whether to display the batch actions menu
	 *
	 * @type {boolean}
	 * @memberof TableSorterComponent
	 */
	batchActionsShown: boolean = false;

	isHidden(button: NbTableSorterButton, item: any) {
		if (typeof button.hidden === 'function') {
			return button.hidden(item);
		}
		return button.hidden;
	}

	/**
	 * Expand or unexpand an expanding row
	 *
	 * @param {NbTableSorterItem} item
	 * @memberof TableSorterComponent
	 */
	toggleExpandedRow(item: NbTableSorterItem) {
		item.unfold = !item.unfold;
	}

	/**
	 * Select or unselect all page items
	 *
	 * @memberof TableSorterComponent
	 */
	toggleAll() {
		this.allRowsSelected = !this.allRowsSelected;
		this.data[this.mapping.data].forEach(o => {
			const needle = this.selectableProperty ? o[this.selectableProperty] : o;
			const index = this.selectedItems.indexOf(needle);
			if (index > -1 && !this.allRowsSelected) {
				this.selectedItems.splice(index, 1);
			} else if (index === -1 && this.allRowsSelected) {
				this.selectedItems.push(needle);
			}
			o.selected = this.allRowsSelected;
		});
		this.onSelected.emit(this.selectedItems);
		this.onChange(this.selectedItems);
	}

	/**
	 * Select or unselect a row
	 *
	 * @param {*} item
	 * @memberof TableSorterComponent
	 */
	toggle(item: any) {
		const needle = this.selectableProperty ? item[this.selectableProperty] : item;
		const index = this.selectedItems.indexOf(needle);
		if (index > -1) {
			this.selectedItems.splice(index, 1);
			item.selected = false;
		} else {
			this.selectedItems.push(needle);
			item.selected = true;
		}

		this.allRowsSelected = this.data[this.mapping.data].every(o => o.selected);
		this.onSelected.emit(this.selectedItems);
		this.onChange(this.selectedItems);
	}

	/**
	 * Select or deselect a row if it exists in the collection of selected items
	 *
	 * @memberof TableSorterComponent
	 */
	markSelected() {
		if (!this.data?.[this.mapping.data]?.length) {
			return;
		}
		this.data[this.mapping.data].forEach(o => {
			const needle = this.selectableProperty ? o[this.selectableProperty] : o;
			o.selected = this._contains(this.selectedItems, needle);
		});
		this.allRowsSelected = this.data[this.mapping.data].every(o => o.selected);
	}

	/**
	 * Check if a needle exists in a list
	 *
	 * @private
	 * @param {any[]} list
	 * @param {*} needle
	 * @return {*}  {boolean}
	 * @memberof TableSorterComponent
	 */
	private _contains(list: any[], needle: any): boolean {

		if (typeof needle === 'object' && needle !== null) {

			list = list.map(o => {
				const { selected, ...clone } = o;
				return clone;
			});

			const { selected, ...p } = needle;
			return list.some(o => JSON.stringify(o) === JSON.stringify(p));
		}
		return list.indexOf(needle) > -1;
	}

	/**
	 * Initializes the filtering form and its subscription
	 *
	 * @memberof TableSorterComponent
	 */
	_initializeFilterForm(): void {
		this.filterFGSct?.unsubscribe();
		const specificSearchFG = this._fb.group({});

		this.filterHeaders = (this._headers as NbTableSorterHeader[]).filter(h => typeof h === 'object' && h.filter);
		this.filterHeaders.forEach(h => {
			specificSearchFG.addControl(h.filter.key || h.property, new FormControl(null));
		});

		if (this.id) {
			const view = JSON.parse(localStorage.getItem('nb-table-sorter_view_' + this.id)) ?? {};
			specificSearchFG.patchValue(view);
		}

		this.filterFG = this._fb.group({
			searchText: [],
			specificSearch: specificSearchFG
		});

		this.filterFGSct = merge(
			this.filterTrigger$.pipe(
				tap(() => this.filterLoading = true)
			),
			this.filterFG.valueChanges.pipe(
				tap(() => {
					this.filterLoading = true;
					if (this.viewSelector) {
						this.viewSelector.value = null;
					}
				}),
				debounceTime(this.debounce)
			)
		).pipe(
			debounceTime(this.debounce),
			tap(o => {
				this.filterChange.emit(this.filterFG.value);
				this.filterLoading = false;
			}),
		).subscribe();
	}

	/**
	 * Clean the advanced filter form
	 *
	 * @memberof TableSorterComponent
	 */
	clearAdvancedFilters(): void {
		this.filterFG.reset();
	}
}