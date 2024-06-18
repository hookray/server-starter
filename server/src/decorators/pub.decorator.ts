import { SetMetadata } from "@nestjs/common";

export const PublicKey = "Public";

export const Pub = () => SetMetadata(PublicKey, true);