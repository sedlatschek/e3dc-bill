import puppeteer from 'puppeteer';

type CreatePdfOptions = {
  html: string;
  path: string;
}

export async function createPdf(options: CreatePdfOptions): Promise<void> {
  const { html, path } = options;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(html);
  await page.emulateMediaType('screen');
  await page.pdf({
    path,
    margin: {
      top: '18mm',
      right: '18mm',
      bottom: '20mm',
      left: '25mm',
    },
    printBackground: true,
    format: 'A4',
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="position: absolute; bottom: 12mm; right: 12mm; font-size: 11pt"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });

  await page.close();
};
