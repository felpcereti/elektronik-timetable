import { TimeTableListResponse } from 'types/TimeTable';
import { List, TimetableList } from '@wulkanowy/timetable-parser';
import { ParsedInfo } from 'types/parsedDataTypes';
import { parseList } from './dataParsers';

function isTimetableListEmpty(list: List) {
  return !list.classes.length || !list.teachers?.length || !list.rooms?.length;
}

async function fetchTimeTableList(): Promise<TimeTableListResponse> {
  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_PROXY_URL
        ? `${process.env.NEXT_PUBLIC_PROXY_URL}/`
        : ''
    }${process.env.NEXT_PUBLIC_TIMETABLE_BASE_URL}/lista.html`
  );
  const timeTableList = new TimetableList(await response.text()).getList();
  let parsedInfo: ParsedInfo | undefined;

  let status: TimeTableListResponse['status'];

  if (response.ok) {
    status = 'empty';
    if (!isTimetableListEmpty(timeTableList)) {
      status = 'ok';
      parsedInfo = parseList(timeTableList);
    }
  } else {
    status = 'error';
  }
  
  return { parsedInfo, status };
}

export default fetchTimeTableList;
