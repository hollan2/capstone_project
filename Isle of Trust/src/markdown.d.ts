// To help typescript with markdown files
declare module "*.md" {
    const value: string; // markdown is just a string
    export default value;
}
