import { PaginatedClient } from "$lib/api/paginated-client.svelte";

interface Employee {
  id: string;
  givenName: string;
  surname: string;
  fullName: string;
  roles: string[];
}

interface EmployeeWithLocations extends Employee {
  locations: {
    locationId: string;
    role: string;
    userId: string;
  }[];
}

interface EmployeesMeta {
  locations: {
    email: string | null;
    id: string;
    name: string;
    postOfficeType: string;
    region: string;
    regionOrg: string;
    spuName: string | null;
    zip: string;
  }[];
}

class EmployeesClient extends PaginatedClient<Employee, EmployeeWithLocations, EmployeesMeta, {}> {
  constructor() {
    super("/api/employees");
  }

  protected singleItemToListItem(item: EmployeeWithLocations): Employee {
    return item;
  }
}

export let employeesClient = new EmployeesClient();
