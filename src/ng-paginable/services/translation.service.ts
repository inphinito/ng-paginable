// Angular
import { Injectable } from '@angular/core';
// Tranlsation
import { TranslateService } from '@ngx-translate/core';

export interface Locale {
	lang: string;
	// tslint:disable-next-line:ban-types
	data: Object;
}

@Injectable({
	providedIn: 'root'
})
export class TranslationService {

	// Private properties
	private langIds: any = [];

	/**
	 * Service Constructor
	 *
	 * @param translate: TranslateService
	 */
	constructor(
		private translate: TranslateService
	) {
		// add new langIds to the list
		this.translate.addLangs(['en']);
	}

	/**
	 * Load Translation
	 *
	 * @param args: Locale[]
	 */
	loadTranslations(...args: Locale[]): void {
		const locales = [...args];

		locales.forEach(locale => {
			// use setTranslation() with the third argument set to true
			// to append translations instead of replacing them
			this.translate.setTranslation(locale.lang, locale.data, true);

			this.langIds.push(locale.lang);
		});

		// add new languages to the list
		this.translate.addLangs(this.langIds);
	}

	/**
	 * Setup language
	 *
	 * @param lang: any
	 */
	setLanguage(lang: string) {
		if (lang) {
			lang = lang.trim().toLowerCase();
			this.translate.use(this.translate.getDefaultLang());
			this.translate.use(lang);
			localStorage.setItem('language', lang);
		}
	}

	/**
	 * Returns selected language
	 */
	getSelectedLanguage(): any {
		return localStorage.getItem('language') || this.translate.getDefaultLang();
	}
}
