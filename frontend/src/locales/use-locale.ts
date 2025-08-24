import "dayjs/locale/zh-cn";
import en_US from "antd/locale/en_US";
import uk_UA from "antd/locale/uk_UA";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import type { Locale as AntdLocal } from "antd/es/locale";
import { LocalEnum } from "#/enum";

type Locale = keyof typeof LocalEnum;
type Language = {
	locale: keyof typeof LocalEnum;
	icon: string;
	label: string;
	antdLocal: AntdLocal;
};

export const LANGUAGE_MAP: Record<Locale, Language> = {
	[LocalEnum.uk_UA]: {
		locale: LocalEnum.uk_UA,
		label: "Ukrainian",
		icon: "flag-ua",
		antdLocal: uk_UA,
	},
	[LocalEnum.en_US]: {
		locale: LocalEnum.en_US,
		label: "English",
		icon: "flag-us",
		antdLocal: en_US,
	},
};

export default function useLocale() {
	const { t, i18n } = useTranslation();

	const locale = (i18n.resolvedLanguage || LocalEnum.en_US) as Locale;
	const language = LANGUAGE_MAP[locale];

	/**
	 * localstorage -> i18nextLng change
	 */
	const setLocale = (locale: Locale) => {
		i18n.changeLanguage(locale);
		// set lang ant dayjs
		document.documentElement.lang = locale;
		dayjs.locale(locale);
	};

	return {
		t,
		locale,
		language,
		setLocale,
	};
}
