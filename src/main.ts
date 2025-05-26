import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import yargs from 'yargs';
import { Rst } from './filter';

enum Format {
  Sphinx = 'sphinx',
  Mkdocs = 'mkdocs',
}

function formatToPandoc(format: Format): string {
  if (format == Format.Sphinx) return 'rst';
  else if (format == Format.Mkdocs) return 'markdown';
  else {
    return 'unknown';
  }
}

export interface Meta {
  title: string;
  metaTitle: string;

  sectionTitle: string;
  shortDescription: string;
  pageDescription: string;
  metaDescription: string;
  weight: number;
  uuid: string;
}

function fetchMetaContent(_filePath: string, file: string): Meta {
  // TODO: Improve title and description fetching.

  return {
    title: file,
    metaTitle: file,
    sectionTitle: file,
    shortDescription: 'no description provided',
    pageDescription: 'no description provided',
    metaDescription: 'no description provided',
    weight: 1,
    uuid: uuidv4(),
  };
}

function checkPandocInstalled(): void {
  try {
    execSync('pandoc --version');
  } catch {
    throw new Error(
      'Pandoc is not installed. Please install pandoc to use this tool.',
    );
  }
}

function convertFile(filePath: string, outDir: string, format: Format): void {
  checkPandocInstalled();
  const file = path.basename(filePath, '.rst');
  const dir = path.join(outDir, file);
  const name = path.join(dir, `${file}.md`);
  const metaName = path.join(dir, `${file}.meta.json`);

  fs.mkdirSync(dir, { recursive: true });

  const pandocFormat = formatToPandoc(format);
  const content = execSync(
    `pandoc --from ${pandocFormat} --to json "${filePath}"`,
  ).toString();
  const filteredContent = JSON.stringify(Rst.processData(JSON.parse(content)));
  const vkdocContent = execSync(`pandoc --verbose --from json --to markdown`, {
    input: filteredContent,
    stdio: 'pipe',
  }).toString();
  // TODO: substitute links here.
  fs.writeFileSync(name, vkdocContent);

  const metaContent = fetchMetaContent(filePath, file);
  fs.writeFileSync(metaName, JSON.stringify(metaContent, null, 2));
}

function walkDir(dir: string, outDir: string, format?: Format): void {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const pathname = path.join(dir, file);
    const stat = fs.statSync(pathname);

    if (stat.isDirectory()) {
      const dirname = path.basename(pathname);
      walkDir(pathname, path.join(outDir, dirname), format);
    } else if (path.extname(file) === '.rst') {
      convertFile(pathname, outDir, format || Format.Sphinx);
    } else {
      fs.mkdirSync(outDir, { recursive: true });
      fs.copyFileSync(pathname, path.join(outDir, file));
    }
  });
}

yargs
  .usage('Usage: $0 <command> [options]')
  .command(
    'convert <inDir> <outDir>',
    'Convert files from input directory to output directory',
    (yargs) =>
      yargs
        .option('format', {
          describe: 'Input file format (auto by default)',
          type: 'string',
          choices: Object.values(Format),
        })
        .positional('inDir', {
          describe: 'Input directory',
          type: 'string',
          demandOption: true,
        })
        .positional('outDir', {
          describe: 'Output directory',
          type: 'string',
          demandOption: true,
        }),
    (yargs) => {
      const inDir = yargs.inDir;
      const outDir = yargs.outDir;
      const format = yargs.format;

      walkDir(inDir, outDir, format);
    },
  )
  .help('h')
  .strictCommands()
  .alias('h', 'help')
  .epilog('Copyright 2025')
  .parseSync();
