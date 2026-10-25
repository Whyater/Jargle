import { useEffect, useRef, useState } from 'preact/hooks';
import {
  appUrl,
  androidApkUrl,
  macDownloadUrl,
  macInstallCmd,
  winDownloadUrl,
  winInstallCmd,
} from '../../config';
import { Screen } from '../components/Screen';
import { Button, LinkButton } from '../components/Button';
import { copyText, selectTextOf } from '../../platform/share';
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}
let savedInstall: BeforeInstallPromptEvent | null = null;
if (typeof window !== 'undefined')
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    savedInstall = event as BeforeInstallPromptEvent;
  });
export function GetJargleScreen() {
  const [canInstall, setCanInstall] = useState(!!savedInstall);
  useEffect(() => setCanInstall(!!savedInstall), []);
  return (
    <Screen title="Get Jargle">
      <div class="stack-lg">
        <section class="stack-sm">
          <h2>Mac</h2>
          <CommandBox label="Paste this into Terminal:" command={macInstallCmd} />
          <LinkButton block href={macDownloadUrl} external>
            Download for Mac
          </LinkButton>
        </section>
        <section class="stack-sm">
          <h2>Windows</h2>
          <CommandBox label="Paste this into PowerShell:" command={winInstallCmd} />
          <LinkButton block href={winDownloadUrl} external>
            Download for Windows
          </LinkButton>
        </section>
        <section class="stack-sm">
          <h2>Android</h2>
          <LinkButton block href={androidApkUrl} external>
            Download the Android app
          </LinkButton>
          <p>Open the file after it downloads, then allow the install.</p>
          {canInstall ? (
            <Button
              primary
              onClick={async () => {
                if (savedInstall) {
                  await savedInstall.prompt();
                  setCanInstall(false);
                }
              }}
            >
              Install app
            </Button>
          ) : null}
        </section>
        <section>
          <h2>iPhone</h2>
          <ol>
            <li>In Safari, tap the Share button.</li>
            <li>Then Add to Home Screen.</li>
            <li>Then Add.</li>
          </ol>
        </section>
        <p>
          Or play in your browser:{' '}
          <a class="link" href={appUrl}>
            {appUrl}
          </a>
        </p>
      </div>
    </Screen>
  );
}

/** An install command with a Copy button. Line breaks are allowed after each "/". */
function CommandBox({ label, command }: { label: string; command: string }) {
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLParagraphElement>(null);
  const pieces = command.split('/');
  async function copy() {
    const ok = await copyText(command);
    if (ok) setCopied(true);
    else if (box.current) selectTextOf(box.current);
  }
  return (
    <div class="stack-sm">
      <p>{label}</p>
      <p class="code-text cmd" ref={box}>
        {pieces.map((piece, i) => (
          <span key={i}>
            {piece}
            {i < pieces.length - 1 ? (
              <>
                /<wbr />
              </>
            ) : null}
          </span>
        ))}
      </p>
      <Button block icon="copy" onClick={copy}>
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}
