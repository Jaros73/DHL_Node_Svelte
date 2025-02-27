import { PaginatedClient } from "$lib/api/paginated-client.svelte";
import type { TechnologicalGroup } from "$lib/api/technological-groups";

interface IrregularCourseListItem {
  id: number;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  locationId: string;
  locationName: string;
  network: string;
  transporter: string;
  vehiclePlate: string;
  trailerPlate?: string;
  distance?: string;
  note?: string;
  initialStop: string;
  initialStopName: string;
  initialStopDate: string;
  initialStopTime: string;
  finalStop: string;
  finalStopName: string;
  finalStopDate: string;
  finalStopTime: string;
  otherLoad?: string;
  load?: string;
  createdByFullName: string;
  updatedByFullName?: string;
  stopsCount: string;
}

interface IrregularCourse {
  id: number;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  locationId: string;
  locationName: string;
  network: string;
  transporter: string;
  vehiclePlate: string;
  trailerPlate?: string;
  distance?: string;
  note?: string;
  initialStop: string;
  initialStopName: string;
  initialStopDate: string;
  initialStopTime: string;
  finalStop: string;
  finalStopName: string;
  finalStopDate: string;
  finalStopTime: string;
  otherLoad?: string;
  load?: string;
  createdByFullName: string;
  updatedByFullName?: string;
  stops: Stop[];
  loads: Load[];
  crates: Crate[];
}

interface Stop {
  irregularCourseId: number;
  sequence: number;
  stopName: string;
}

interface Crate {
  irregularCourseId: number;
  technologicalGroup: string;
  crate: string;
  amount: number;
}

interface Load {
  irregularCourseId: number;
  technologicalGroup: string;
  amount?: number;
  note?: string;
}

interface IrregularCourseMeta {
  locations: { id: string; name: string }[];
  stopLocations: { id: string; name: string }[];
  stops: { id: number; name: string }[];
  transporters: { id: number; name: string }[];
  vehiclePlates: { id: number; name: string }[];
  trailerPlates: { id: number; name: string }[];
  technologicalGroups: TechnologicalGroup[];
}

interface IrregularCourseFilter {
  createdAt?: [string | null | undefined, string | null | undefined] | undefined;
  locationId?: string[] | undefined;
  network?: string[] | undefined;
  load?: string[] | undefined;
}

class IrregularCoursesClient extends PaginatedClient<
  IrregularCourseListItem,
  IrregularCourse,
  IrregularCourseMeta,
  IrregularCourseFilter
> {
  constructor() {
    super("/api/irregular-courses");
  }

  protected singleItemToListItem(item: IrregularCourse): IrregularCourseListItem {
    return { ...item, stopsCount: `${item.stops.length}` };
  }
}

export let irregularCoursesClient = new IrregularCoursesClient();
