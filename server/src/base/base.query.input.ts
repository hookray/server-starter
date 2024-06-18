import { Transform } from "class-transformer";

export abstract class BaseQueryInput {

    @Transform(({ value }) => value ? parseInt(value) : 1)
    current: number;

    @Transform(({ value }) => value ? parseInt(value) : 20)
    pageSize: number;
}