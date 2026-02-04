import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import {
  AppData,
  Element,
  Family,
  Ions,
  Lewis,
  Pictiochimie,
  Success,
} from './data.models';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private data: AppData | null = null;

  private fileUrls: { key: keyof AppData; url: string }[] = [
    { key: 'lewis', url: 'assets/data/lewis.json' },
    { key: 'ions', url: 'assets/data/ions.json' },
    { key: 'success', url: 'assets/data/success.json' },
    { key: 'family', url: 'assets/data/family.json' },
    { key: 'elements', url: 'assets/data/elements.json' },
    { key: 'pictiochimie', url: 'assets/data/pictiochimie.json' },
  ];

  constructor(private http: HttpClient) {}

  async loadData(): Promise<void> {
    try {
      const promises = this.fileUrls.map(async (file) => {
        const data = await lastValueFrom(this.http.get<any>(file.url));
        return { key: file.key, data };
      });

      const responses = await Promise.all(promises);

      this.data = responses.reduce((acc, curr) => {
        acc[curr.key] = curr.data;
        return acc;
      }, {} as AppData);

    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  getLewis(): Lewis[] | undefined {
    return this.data?.lewis;
  }

  getIons(): Ions | undefined {
    return this.data?.ions;
  }

  getSuccess(): Success | undefined {
    return this.data?.success;
  }

  getFamily(): Family[] | undefined {
    return this.data?.family;
  }

  getElements(): Element[] | undefined {
    return this.data?.elements;
  }

  getPictiochimie(): Pictiochimie[] | undefined {
    return this.data?.pictiochimie;
  }
}
