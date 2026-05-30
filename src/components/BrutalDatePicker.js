import DatePicker, { registerLocale } from 'react-datepicker';
import { enGB, is as isLocale } from 'date-fns/locale';
import { parseDateString, toDateString } from '../lib/format';

registerLocale('is', isLocale);
registerLocale('en-GB', enGB);

const MIN_DATE = new Date(2000, 0, 1);
const YEAR_COUNT = new Date().getFullYear() - 2000 + 1;

export default function BrutalDatePicker({
  id,
  value,
  onChange,
  language,
  minDate = MIN_DATE,
  maxDate = new Date(),
  placeholder = 'DD/MM/YYYY',
}) {
  const locale = language === 'is' ? 'is' : 'en-GB';

  return (
    <DatePicker
      id={id}
      selected={parseDateString(value)}
      onChange={(date) => onChange(date ? toDateString(date) : '')}
      locale={locale}
      dateFormat="dd/MM/yyyy"
      placeholderText={placeholder}
      className="brutal-input"
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      scrollableYearDropdown
      yearDropdownItemNumber={YEAR_COUNT}
      minDate={minDate}
      maxDate={maxDate}
    />
  );
}
