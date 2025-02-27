import { apiClient } from "$lib/api/api-client";
import { PaginatedClient } from "$lib/api/paginated-client.svelte";

interface RegionalReportListItem {
  id: number;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  dateFor: string;
  category: string;
  network: string;
  locationId: string;
  locationZip: string;
  description?: string;
  actionTaken?: string;
  courseCode?: string;
  coursePlannedArrival?: string;
  courseRealArrival?: string;
  courseDelayEnumId?: string;
  note?: string;
  createdByFullName: string;
  updatedByFullName: string;
  locationName: string;
  courseDelayName?: string;
  attachments: string;
}

export interface RegionalReport {
  id: number;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  dateFor: string;
  category: string;
  network: string;
  locationId: string;
  locationZip: string;
  description?: string;
  actionTaken?: string;
  courseCode?: string;
  coursePlannedArrival?: string;
  courseRealArrival?: string;
  courseDelayEnumId?: string;
  note?: string;
  createdByFullName: string;
  updatedByFullName: string;
  locationName: string;
  courseDelayName?: string;
  attachments: Array<{
    filename: string;
    displayName: string;
  }>;
}

interface RegionalReportsMeta {
  locations: { id: string; name: string }[];
  delayReasons: { id: number; name: string }[];
}

interface RegionalReportsFilter {
  createdAt?: [string | null | undefined, string | null | undefined] | undefined;
  locationId?: string[] | undefined;
  category?: string[] | undefined;
  network?: string[] | undefined;
  attachment?: string[] | undefined;
}

class RegionalReportsClient extends PaginatedClient<
  RegionalReportListItem,
  RegionalReport,
  RegionalReportsMeta,
  RegionalReportsFilter
> {
  constructor() {
    super("/api/regional-reports");
  }

  protected override singleItemToListItem(item: RegionalReport): RegionalReportListItem {
    return { ...item, attachments: item.attachments.length.toString() };
  }

  async uploadFiles(id: number, payload: FormData) {
    let res = await apiClient.post<RegionalReport>(`${this.basePath}/${id}`, { body: payload });
    this.addOrReplace(this.singleItemToListItem(res));

    return res;
  }

  async removeFile(id: number, filename: string) {
    let res = await apiClient.delete<RegionalReport>(`${this.basePath}/${id}/${filename}`);
    this.addOrReplace(this.singleItemToListItem(res));

    return res;
  }
}

export let regionalReportsClient = new RegionalReportsClient();
