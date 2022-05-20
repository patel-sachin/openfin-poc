export interface IDisposable {
    disposeAsync: () => Promise<void>;
}