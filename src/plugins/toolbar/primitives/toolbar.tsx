import * as RadixSelect from '@radix-ui/react-select'
import * as RadixToolbar from '@radix-ui/react-toolbar'
import classNames from 'classnames'
import React from 'react'
import styles from '../../../styles/ui.module.css'
import { TooltipWrap } from './TooltipWrap'
import { SelectButtonTrigger, SelectContent, SelectItem } from './select'
import { EditorInFocus, corePluginHooks } from '../../core'

function decorate<P extends { className?: string | undefined }>(Component: React.ComponentType<P>, decoratedProps: P) {
  return (props: P) => {
    const className = classNames(decoratedProps.className, props.className)
    return <Component {...decoratedProps} {...props} className={className} />
  }
}

function decorateWithRef<P extends { className?: string | undefined }>(
  Component: React.ForwardRefExoticComponent<P>,
  decoratedProps: Partial<React.PropsWithoutRef<P>> & { 'data-toolbar-item'?: boolean }
) {
  return React.forwardRef<object, P>((props: P, ref) => {
    const className = classNames(decoratedProps.className, props.className)
    return <Component {...decoratedProps} {...props} className={className} ref={ref} />
  })
}

function addTooltipToChildren<C extends React.ComponentType<{ children: React.ReactNode }>>(Component: C) {
  return ({ title, children, ...props }: React.ComponentProps<C> & { title: string }) => {
    return (
      <Component {...(props as any)}>
        <TooltipWrap title={title}>{children}</TooltipWrap>
      </Component>
    )
  }
}

export const Root = decorate(RadixToolbar.Root, { className: styles.toolbarRoot })

export const Button = decorateWithRef(RadixToolbar.Button, { className: styles.toolbarButton, 'data-toolbar-item': true })

export const ButtonWithTooltip = addTooltipToChildren(Button)

export const ToolbarToggleItem = decorateWithRef(RadixToolbar.ToggleItem, {
  className: styles.toolbarToggleItem,
  'data-toolbar-item': true
})

export const SingleToggleGroup = decorateWithRef(RadixToolbar.ToggleGroup, {
  type: 'single',
  className: styles.toolbarToggleSingleGroup
})

export const ToggleSingleGroupWithItem = React.forwardRef<
  HTMLDivElement,
  Omit<RadixToolbar.ToolbarToggleGroupSingleProps, 'type'> & { on: boolean; title: string; disabled?: boolean }
>(({ on, title, children, disabled, ...props }, forwardedRef) => {
  return (
    <RadixToolbar.ToggleGroup
      type="single"
      className={styles.toolbarToggleSingleGroup}
      {...props}
      value={on ? 'on' : 'off'}
      ref={forwardedRef}
    >
      <ToolbarToggleItem title={title} value="on" disabled={disabled}>
        <TooltipWrap title={title}>{children}</TooltipWrap>
      </ToolbarToggleItem>
    </RadixToolbar.ToggleGroup>
  )
})

export const MultipleChoiceToggleGroup: React.FC<{
  items: {
    title: string
    contents: React.ReactNode
    active: boolean
    onChange: (active: boolean) => void
    disabled?: boolean
  }[]
}> = ({ items }) => {
  return (
    <div className={styles.toolbarGroupOfGroups}>
      {items.map((item, index) => (
        <ToggleSingleGroupWithItem
          key={index}
          title={item.title}
          on={item.active}
          onValueChange={(v) => item.onChange(v === 'on')}
          disabled={item.disabled}
        >
          {item.contents}
        </ToggleSingleGroupWithItem>
      ))}
    </div>
  )
}

interface SingleChoiceToggleGroupProps<T extends string> {
  items: {
    title: string
    value: T
    contents: React.ReactNode
  }[]
  onChange: (value: T) => void
  value: T
  className?: string
}

export const SingleChoiceToggleGroup = <T extends string>({ value, onChange, className, items }: SingleChoiceToggleGroupProps<T>) => {
  return (
    <div className={styles.toolbarGroupOfGroups}>
      <RadixToolbar.ToggleGroup
        type="single"
        className={classNames(styles.toolbarToggleSingleGroup, className)}
        onValueChange={onChange}
        value={value || ''}
        onFocus={(e) => e.preventDefault()}
      >
        {items.map((item, index) => (
          <ToolbarToggleItem key={index} value={item.value}>
            <TooltipWrap title={item.title}>{item.contents}</TooltipWrap>
          </ToolbarToggleItem>
        ))}
      </RadixToolbar.ToggleGroup>
    </div>
  )
}
export interface ButtonOrDropdownButtonProps<T extends string> {
  children: React.ReactNode
  title: string
  onChoose: (T: string) => void
  items: { value: T; label: string }[]
}

export const ButtonOrDropdownButton = <T extends string>(props: ButtonOrDropdownButtonProps<T>) => {
  return (
    <>
      {props.items.length === 1 ? (
        <ButtonWithTooltip title={props.title} onClick={() => props.onChoose('')}>
          {props.children}
        </ButtonWithTooltip>
      ) : (
        <RadixSelect.Root value="" onValueChange={props.onChoose}>
          <SelectButtonTrigger title={props.title}>{props.children}</SelectButtonTrigger>

          <SelectContent className={styles.toolbarButtonDropdownContainer}>
            {props.items.map((item, index) => (
              <SelectItem key={index} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </RadixSelect.Root>
      )}
    </>
  )
}

type ConditionalContentsOption = {
  when: (rootNode: EditorInFocus | null) => boolean
  contents: () => React.ReactNode
}

type FallBackOption = { fallback: () => React.ReactNode }

function isConditionalContentsOption(option: ConditionalContentsOption | FallBackOption): option is ConditionalContentsOption {
  return Object.hasOwn(option, 'when')
}

interface ConditionalContentsProps {
  options: (ConditionalContentsOption | FallBackOption)[]
}

export const ConditionalContents: React.FC<ConditionalContentsProps> = ({ options }) => {
  const [editorInFocus] = corePluginHooks.useEmitterValues('editorInFocus')
  const contents = React.useMemo(() => {
    const option = options.find((option) => {
      if (isConditionalContentsOption(option)) {
        if (option.when(editorInFocus)) {
          return true
        }
      } else {
        return true
      }
    })
    return option ? (isConditionalContentsOption(option) ? option.contents() : option.fallback()) : null
  }, [options, editorInFocus])

  return <div style={{ display: 'flex' }}>{contents}</div>
}

export const Separator = RadixToolbar.Separator