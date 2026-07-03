export interface CompanyProps {
  id?: string;
  name: string;
  website?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Company {
  public readonly id?: string;
  public name: string;
  public website?: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: CompanyProps) {
    this.id = props.id;
    this.name = props.name;
    this.website = props.website;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
