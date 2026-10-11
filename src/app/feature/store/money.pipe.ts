import { Pipe, PipeTransform } from '@angular/core';
import { formatMoney } from './store.data';

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
	transform(value: number): string {
		return formatMoney(value);
	}
}
