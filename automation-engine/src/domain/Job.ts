export interface JobProps {
  id?: string;
  title: string;
  description: string;
  url: string;
  location?: string;
  salary?: string;
  status: string;
  score?: number;
  fitExplanation?: string;
  companyId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Job {
  public readonly id?: string;
  public title: string;
  public description: string;
  public url: string;
  public location?: string;
  public salary?: string;
  public status: string;
  public score?: number;
  public fitExplanation?: string;
  public companyId: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: JobProps) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.url = props.url;
    this.location = props.location;
    this.salary = props.salary;
    this.status = props.status;
    this.score = props.score;
    this.fitExplanation = props.fitExplanation;
    this.companyId = props.companyId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isGoodFit(minScore = 70): boolean {
    return this.score !== undefined && this.score >= minScore;
  }
}
