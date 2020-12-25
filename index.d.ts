import type {WebpackPluginInstance, Configuration, RuleSetRule} from "webpack";

export interface Builder {
    withExtension(...extensions: string[]): this;
    withPlugin(plugin: WebpackPluginInstance): this;
    withRule(rule: RuleSetRule): this;
    withFont(outputPath: string): this;
    withNoParse(path: Configuration["module"]["noParse"]): this;
    withReact(): this;
    withCss(outName: string, debugOutName?: string): this;
    withHtml(templatePath: string, outName: string): this;
    withExternals(externals: Configuration["externals"]): this;
    withNativeModules(): this;
    withFiles(options: string | unknown[]): this;
    withLicenseHint(name: string, version: string, license: string): this;
    withDevServer(port: number, allowedHosts?: string[]): this;
    asLibrary(type: "amd"|"umd"|"commonjs", name: string): this;
    to(target: string, path: string, outFileName: string, debugOutFileName?: string): this;
    build(): Configuration;
}

export function from(path: string): Builder;