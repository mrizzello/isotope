import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private data: any;

  constructor(private http: HttpClient) { }

  getData(): Promise<any> {
    if (this.data) {
      return Promise.resolve(this.data);
    } else {
      return this.http.get('assets/data.json').toPromise()
        .then((data: any) => {
          this.data = data;
          return data;
        });
    }
  }
}
