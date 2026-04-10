export interface FaqModel {
  id: number;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  published: boolean;
}

export interface FaqTranslationModel {
  id?: number;
  languageCode: string;
  question: string;
  answer: string;
  category: string;
}

export interface FaqAdminResponse {
  id: number;
  sortOrder: number;
  published: boolean;
  translations: FaqTranslationModel[];
}

export interface FaqUpsertRequest {
  sortOrder: number;
  published: boolean;
  translations: FaqTranslationModel[];
}
