import { apiClient } from "$lib/api/api-client";
import { PaginatedClient } from "$lib/api/paginated-client.svelte";
import type { TechnologicalGroup } from "$lib/api/technological-groups";

interface CourseListItem {
  id: number;
  createdAt: string;
  locationId: string;
  locationName: string;
  network: string;
  courseCode: string;
  departureDate: string;
  departurePlannedTime?: string;
  departureDiff?: number;
  arrivalPlannedTime?: string;
  arrivalDiff?: number;
  updatedAt?: string;
}

interface Course {
  id: number;
  createdAt: string;
  createdBy: string;
  createdByFullName: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedByFullName?: string;
  locationId: string;
  locationName: string;
  courseCode: string;
  departureDate: string;
  network: string;
  transporterEnumId: number;
  transporterName: string;
  seals: string;
  departurePlannedTime?: string;
  departureRealTime?: string;
  departureDiff?: number;
  departureDelayReasonEnumId?: number;
  departureDelayName?: string;
  departureNote?: string;
  departureLoad?: number;
  departureOther?: string;
  arrivalPlannedTime?: string;
  arrivalRealTime?: string;
  arrivalDiff?: number;
  arrivalDelayReasonEnumId?: number;
  arrivalDelayName?: string;
  arrivalNote?: string;
  arrivalLoad?: number;
  arrivalOther?: string;
  loads: Load[];
  crates: Crate[];
  files: {
    group: string;
    filename: string;
    displayName: string;
  }[];
}

interface Load {
  technologicalGroup: string;
  group: string;
  amount?: number;
  note?: string;
}

interface Crate {
  technologicalGroup: string;
  group: string;
  crate: string;
  amount: number;
}

interface CoursesMeta {
  locations: { id: string; name: string }[];
  transporters: { id: number; name: string }[];
  delayReasons: { id: number; name: string }[];
  technologicalGroups: TechnologicalGroup[];
}

interface CoursesFilter {
  createdAt?: [string | null | undefined, string | null | undefined];
  locationId?: string[] | undefined;
  network?: string[] | undefined;
  departureDelay?: string[] | undefined;
  arrivalDelay?: string[] | undefined;
}

class CoursesClient extends PaginatedClient<CourseListItem, Course, CoursesMeta, CoursesFilter> {
  constructor() {
    super("/api/courses");
  }

  protected override singleItemToListItem(item: Course): CourseListItem {
    return item;
  }

  async uploadFiles(id: number, payload: FormData) {
    let res = await apiClient.post<Course>(`${this.basePath}/${id}`, { body: payload });
    this.addOrReplace(this.singleItemToListItem(res));

    return res;
  }

  async removeFile(id: number, filename: string) {
    let res = await apiClient.delete<Course>(`${this.basePath}/${id}/${filename}`);
    this.addOrReplace(this.singleItemToListItem(res));

    return res;
  }
}

export let coursesClient = new CoursesClient();
