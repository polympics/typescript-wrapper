/** Polyfills for browser functions not available in Node. */
export {default as fetch} from 'node-fetch';

export function btoa(string: string): string {
    return Buffer.from(string).toString('base64');
}
