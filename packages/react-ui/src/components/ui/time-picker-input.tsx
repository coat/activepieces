import React, { useRef } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

import { AutoComplete } from './autocomplete';
import {
  Period,
  TimePickerType,
  getArrowByType,
  getDateByType,
  setDateByType,
} from './time-picker-utils';
import { setDate } from 'date-fns';

export interface TimePickerInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  picker: TimePickerType;
  date: Date | undefined;
  setDate: (date: Date) => void;
  period?: Period;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
  isActive: boolean;
  autoCompleteList?: { value: string; label: string }[];
  isAutocompleteOpen?: boolean;
}

const TimePickerInputInner = React.forwardRef<
  HTMLInputElement,
  TimePickerInputProps
>(
  (
    {
      className,
      type = 'tel',
      value,
      id,
      name,
      date = new Date(new Date().setHours(0, 0, 0, 0)),
      setDate,
      onChange,
      onKeyDown,
      picker,
      period,
      onLeftFocus,
      onRightFocus,
      isActive,
      isAutocompleteOpen,
      ...props
    },
    ref,
  ) => {
    const [flag, setFlag] = React.useState<boolean>(false);
    const [prevIntKey, setPrevIntKey] = React.useState<string>('0');

    /**
     * allow the user to enter the second digit within 2 seconds
     * otherwise start again with entering first digit
     */
    React.useEffect(() => {
      if (flag) {
        const timer = setTimeout(() => {
          setFlag(false);
        }, 2000);

        return () => clearTimeout(timer);
      }
    }, [flag]);

    const calculatedValue = React.useMemo(() => {
      return getDateByType(date, picker);
    }, [date, picker]);

    const calculateNewValue = (key: string) => {
      /*
       * If picker is '12hours' and the first digit is 0, then the second digit is automatically set to 1.
       * The second entered digit will break the condition and the value will be set to 10-12.
       */
      if (picker === '12hours') {
        if (flag && calculatedValue.slice(1, 2) === '1' && prevIntKey === '0')
          return '0' + key;
      }

      return !flag ? '0' + key : calculatedValue.slice(1, 2) + key;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Tab') return;
      e.preventDefault();
      if (e.key === 'ArrowRight') onRightFocus?.();
      if (e.key === 'ArrowLeft') onLeftFocus?.();
      if (['ArrowUp', 'ArrowDown'].includes(e.key) && !isAutocompleteOpen) {
        const step = e.key === 'ArrowUp' ? 1 : -1;
        const newValue = getArrowByType(calculatedValue, step, picker);
        if (flag) setFlag(false);
        const tempDate = new Date(date);
        setDate(setDateByType(tempDate, newValue, picker, period));
      }
      if (e.key >= '0' && e.key <= '9') {
        if (picker === '12hours') setPrevIntKey(e.key);
        const newValue = calculateNewValue(e.key);
        if (flag) onRightFocus?.();
        setFlag((prev) => !prev);
        const tempDate = new Date(date);
        setDate(setDateByType(tempDate, newValue, picker, period));
      }
    };

    return (
      <Input
        ref={ref}
        id={id || picker}
        name={name || picker}
        className={cn(
          'w-[73px] h-[29px] p-0 text-center rounded-xs bg-transparent transition-all  text-sm tabular-nums border-none [&::-webkit-inner-spin-button]:appearance-none',
          className,
          {
            'bg-background': isActive,
            'hover:bg-accent': !isActive,
          },
        )}
        value={value || calculatedValue}
        onChange={(e) => {
          e.preventDefault();
          debugger;
          onChange?.(e);
        }}
        type={type}
        inputMode="decimal"
        onKeyDown={(e) => {
          onKeyDown?.(e);
          handleKeyDown(e);
        }}
        {...props}
      />
    );
  },
);
TimePickerInputInner.displayName = 'TimePickerInputInner';
const TimePickerInput = React.forwardRef<
  HTMLInputElement,
  TimePickerInputProps
>((props, ref) => {
  const { autoCompleteList, isActive } = props;
  const [open, setOpen] = React.useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  if (isNil(autoCompleteList) || autoCompleteList.length === 0) {
    return <TimePickerInputInner {...props} ref={ref} />;
  }
  const [filterValue, setFilterValue] = React.useState('');
  return (
    <AutoComplete
      className={cn('bg-transparent text-muted-foreground rounded-xs', {
        'bg-background': isActive,
        'hover:bg-accent': !isActive,
        'text-foreground': isActive,
      })}
      items={autoCompleteList.filter((item)=>item.label.includes(filterValue))}
      selectedValue={''}
      open={open}
      setOpen={(open)=>{
        setFilterValue('');
        setOpen(open);
      }}
      listRef={listRef}
      onSelectedValueChange={(value) => {
        const tempDate = new Date(props.date || new Date(new Date().setHours(0,0,0,0)));
        props.setDate(
          setDateByType(tempDate, value, props.picker, props.period),
        );
      }}
    >
      <TimePickerInputInner
        {...props}
        onKeyDown={(e) => {
          props.onKeyDown?.(e);
          if (
            e.key === 'ArrowDown' ||
            e.key === 'ArrowUp' ||
            (e.key === 'Enter' && open)
          ) {
            const event = new KeyboardEvent('keydown', {
              key: e.key,
              bubbles: true,
              cancelable: true,
            });
            if (listRef.current) {
              listRef.current.dispatchEvent(event);
            }
            
          }
         
        }}
        setDate={(date)=>{
          props.setDate(date);
          const filterValue = getDateByType(date, props.picker);
          setFilterValue(filterValue[0] === '0' ? filterValue.slice(1) : filterValue);
        }}
        ref={ref}
        isAutocompleteOpen={open}
      />
    </AutoComplete>
  );
});
TimePickerInput.displayName = 'TimePickerInput';

export { TimePickerInput };
