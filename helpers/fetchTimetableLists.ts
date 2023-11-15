import {  TimetableList } from '@wulkanowy/timetable-parser';
import { ParsedListInfo } from 'types/parsedDataTypes';
import { parseList } from './dataParsers';

export const URL = `${
  process.env.NEXT_PUBLIC_PROXY_URL
    ? `${process.env.NEXT_PUBLIC_PROXY_URL}/`
    : ''
}${process.env.NEXT_PUBLIC_TIMETABLE_BASE_URL}/lista.html`



async function fetchTimeTableLists(): Promise<ParsedListInfo> {
  const response = await fetch(URL);
  if (!response.ok) {
    throw new Error("Network error while parsing response")
  }
  const list = new TimetableList(await response.text()).getList();
  if(!list.classes.length || !list.teachers?.length || !list.rooms?.length) {
    throw new Error(`Some TimetableList (${URL}) is empty or it doesn't exist.
Elements count in lists:  
classes(oddziały): ${list.classes.length}
teachers(oddziały): ${list.teachers?.length}
rooms(sale): ${list.rooms?.length}`);
  }
  
  return parseList(list);
}

export default fetchTimeTableLists;
