import * as repository from "./repository";

export function createAnonymousUser(): Promise<string> {
    return repository.createUser();
}
