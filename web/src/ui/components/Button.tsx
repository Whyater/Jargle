import type { ComponentChildren } from 'preact';
import { Icon } from './Icons';

interface ButtonProps {
  children: ComponentChildren;
  onClick?: () => void;
  primary?: boolean;
  block?: boolean;
  small?: boolean;
  /** Shown as unavailable but stays focusable, so the reason in the label can be read. */
  disabled?: boolean;
  icon?: 'home' | 'settings' | 'help' | 'check' | 'lock' | 'back' | 'copy' | 'share' | 'download';
  label?: string;
  id?: string;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

export function Button(props: ButtonProps) {
  let className = 'btn';
  if (props.primary) className += ' btn-primary';
  if (props.block) className += ' btn-block';
  if (props.small) className += ' btn-small';

  function handleClick() {
    if (props.disabled) return;
    if (props.onClick) props.onClick();
  }

  return (
    <button
      type="button"
      id={props.id}
      class={className}
      onClick={handleClick}
      aria-disabled={props.disabled ? 'true' : undefined}
      aria-label={props.label}
      ref={props.buttonRef}
    >
      {props.icon ? <Icon name={props.icon} /> : null}
      <span>{props.children}</span>
    </button>
  );
}

interface LinkButtonProps {
  href: string;
  children: ComponentChildren;
  primary?: boolean;
  block?: boolean;
  small?: boolean;
  icon?: 'home' | 'settings' | 'help' | 'check' | 'lock' | 'back' | 'copy' | 'share' | 'download';
  external?: boolean;
}

/** Looks like a button but navigates (a real link, so it works with the Back button). */
export function LinkButton(props: LinkButtonProps) {
  let className = 'btn';
  if (props.primary) className += ' btn-primary';
  if (props.block) className += ' btn-block';
  if (props.small) className += ' btn-small';
  return (
    <a
      class={className}
      href={props.href}
      target={props.external ? '_blank' : undefined}
      rel={props.external ? 'noopener' : undefined}
    >
      {props.icon ? <Icon name={props.icon} /> : null}
      <span>{props.children}</span>
    </a>
  );
}
