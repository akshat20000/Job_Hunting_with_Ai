export interface ResumeProps {
  id?: string;
  name: string;
  content: string;
  isMaster: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Resume {
  public readonly id?: string;
  public name: string;
  public content: string;
  public isMaster: boolean;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: ResumeProps) {
    this.id = props.id;
    this.name = props.name;
    this.content = props.content;
    this.isMaster = props.isMaster;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
