import { Student } from '../types';

export const DEFAULT_COACH_PIN = '998877';

/**
 * 6 haneli benzersiz rastgele bir PIN kodu üretir.
 */
export function generateRandom6DigitPin(existingPins: string[] = []): string {
  let pin = '';
  let attempts = 0;
  do {
    // 100000 ile 999999 arasında rastgele 6 haneli tam sayı
    pin = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;
  } while (existingPins.includes(pin) && attempts < 100);
  return pin;
}

/**
 * Mevcut veya kayıtlı öğrencilerin hepsinde 6 haneli benzersiz PIN olmasını garanti eder.
 */
export function ensureAllStudentsHavePins(students: any[]): Student[] {
  const existingPins: string[] = [];
  
  return students.map((std, index) => {
    let pin = std.pinCode;
    // Eğer PIN yoksa veya 6 haneli değilse veya çakışıyorsa yenisini ata
    if (!pin || typeof pin !== 'string' || pin.length !== 6 || existingPins.includes(pin)) {
      // Örnek seedler için sabit hoş numaralar
      const defaultPins = ['582194', '739401', '241893', '615820', '839215', '472091'];
      const candidate = defaultPins[index] || generateRandom6DigitPin(existingPins);
      pin = existingPins.includes(candidate) ? generateRandom6DigitPin(existingPins) : candidate;
    }
    existingPins.push(pin);
    return {
      ...std,
      pinCode: pin,
    };
  });
}
