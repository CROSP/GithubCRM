import { getStringItem } from "@/utils/storage";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { LocalEnum, StorageEnum } from "#/enum";
import en_US from "./lang/en_US";
import uk_UA from "./lang/uk_UA";

const defaultLng = getStringItem(StorageEnum.I18N) || (LocalEnum.en_US as string);

document.documentElement.lang = defaultLng;

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		debug: true,
		lng: defaultLng,
		fallbackLng: LocalEnum.en_US,
		interpolation: {
			escapeValue: false,
		},
		resources: {
			en_US: { translation: en_US },
			uk_UA: { translation: uk_UA },
		},
	});

export const { t } = i18n;
export default i18n;
