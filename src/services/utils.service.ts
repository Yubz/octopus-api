import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilsService {
	chunkArray(array: Array<any>, size: number): Array<Array<any>> {
		const chunkedArr = [];
		for (let i = 0; i < array.length; i += size) {
			chunkedArr.push(array.slice(i, i + size));
		}
		return chunkedArr;
	}

	// Fonction pour calculer l'APR à partir du ROI (0.1 = 10%) et de T (en jours) pour un ROI simple
	calculateSimpleAPR = (ROI: number, T: number): number => {
		return !ROI ? 0 : (ROI / (T / 365)) * 1;
	};

	// Fonction pour calculer l'APR à partir du ROI (0.1 = 10%) et de T (en jours) pour un ROI composé
	calculateCompoundAPR = (ROI: number, T: number): number => {
		return Math.pow(1 + ROI, 1 / (T / 365)) - 1;
	};

	daysBetweenDates = (startDate: Date, endDate: Date): number => {
		// Convertir les deux dates en millisecondes
		const start = startDate.getTime();
		const end = endDate.getTime();

		// Calculer la différence en millisecondes
		const diff = end - start;

		// Convertir la différence en jours
		const days = diff / (1000 * 60 * 60 * 24);

		return days;
	};
}
