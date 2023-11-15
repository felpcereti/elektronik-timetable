import { TableHour, TableLesson } from '@wulkanowy/timetable-parser';
import { ParsedInfo } from './parsedDataTypes';

export interface TimeTableData {
  type: 'class' | 'teacher' | 'room';
  id: number;
  status: 'ok' | 'empty' | 'error';

  title: string;
  generatedDate?: string;

  dayNames: string[];
  days: TableLesson[][][];
  hours: Record<number, TableHour>;
}

export interface TimeTableListResponse {
  parsedInfo?: ParsedInfo;
  status: TimeTableData['status'];
}
