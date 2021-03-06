import { Component, OnInit } from '@angular/core';
import { MockedUsersService } from '../../../mocked-users.service';
import { BREAKPOINTS, PaginableTableHeader, PaginableTablePagination } from '../../../../ng-paginable';

@Component({
	selector: 'responsive',
	templateUrl: './responsive.component.html',
	styleUrls: ['./responsive.component.scss']
})
export class ResponsiveComponent implements OnInit {

	breakpoints = BREAKPOINTS;
	breakAt = 'xs';

	pagination: PaginableTablePagination;
	headers: (PaginableTableHeader | string)[] = [
		'id',
		'username',
		'email',
		'name',
		{
			property: 'actions',
			sticky: 'end',
			buttons: [
				{
					title: 'edit',
					icon: 'fa fa-edit',
					handler: (item) => console.log('edit', item)
				},
				{
					title: 'delete',
					color: 'danger',
					icon: 'fa fa-trash',
					handler: (item) => console.log('delete', item)
				}
			]
		}];
	searchKeys: string[] = ['id', 'username', 'email', 'name'];

	constructor(
		private _mockedUsersSvc: MockedUsersService
	) { }

	ngOnInit() {
		this.fetch();
	}

	async fetch(event: any = {}) {
		try {
			event.searchKeys = this.searchKeys;
			this.pagination = this._mockedUsersSvc.get(event);
		} catch (error) {
			console.error(error);
		}
	}

}
