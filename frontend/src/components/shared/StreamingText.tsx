/**
 * StreamingText — renders text character-by-character with a blinking cursor.
 * Used for system memo, tutorial tooltips, and contract unlock banners.
 *
 * Pass `segments` for rich text (with per-segment styles), or plain `text`.
 * Expose a ref to call `.skip()` for instant reveal.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

export interface TextSegment {
  text: string
  style?: React.CSSProperties
}

export interface StreamingTextHandle {
  skip: () => void
}

interface StreamingTextProps {
  segments: TextSegment[]
  speed?: number          // ms per character (default 22)
  onComplete?: () => void
  cursorColor?: string    // default var(--color-green)
}

export const StreamingText = forwardRef<StreamingTextHandle, StreamingTextProps>(
  function StreamingText({ segments, speed = 22, onComplete, cursorColor = 'var(--color-green)' }, ref) {
    const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0)
    const [revealed, setRevealed] = useState(0)
    const [done, setDone] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const revealedRef = useRef(0)
    const onCompleteRef = useRef(onComplete)
    onCompleteRef.current = onComplete

    useImperativeHandle(ref, () => ({
      skip() {
        if (timerRef.current) clearTimeout(timerRef.current)
        revealedRef.current = totalChars
        setRevealed(totalChars)
        setDone(true)
        onCompleteRef.current?.()
      },
    }))

    useEffect(() => {
      revealedRef.current = 0
      setRevealed(0)
      setDone(false)

      if (totalChars === 0) {
        setDone(true)
        onCompleteRef.current?.()
        return
      }

      timerRef.current = setTimeout(function tick() {
        revealedRef.current++
        const next = revealedRef.current
        setRevealed(next)

        if (next >= totalChars) {
          setDone(true)
          onCompleteRef.current?.()
          return
        }

        // Slightly longer pause on newlines
        let isNewline = false
        let charPos = 0
        for (const seg of segments) {
          if (charPos + seg.text.length >= next) {
            isNewline = seg.text[next - charPos - 1] === '\n'
            break
          }
          charPos += seg.text.length
        }

        const delay = speed + Math.random() * speed * 0.3 + (isNewline ? speed * 3 : 0)
        timerRef.current = setTimeout(tick, delay)
      }, 300)

      return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [segments, totalChars, speed])

    // Render visible characters segment by segment
    const nodes: React.ReactNode[] = []
    let charsLeft = revealed
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!
      if (charsLeft <= 0) break
      const visibleText = seg.text.slice(0, charsLeft)
      charsLeft -= seg.text.length
      const parts = visibleText.split('\n')
      nodes.push(
        <span key={i} style={seg.style}>
          {parts.flatMap((part, j) =>
            j < parts.length - 1 ? [part, <br key={`br-${i}-${j}`} />] : [part],
          )}
        </span>,
      )
    }

    return (
      <span>
        {nodes}
        {!done && (
          <span
            style={{
              display: 'inline-block',
              width: '0.5em',
              height: '1.1em',
              background: cursorColor,
              verticalAlign: 'middle',
              marginLeft: 2,
              animation: 'streaming-cursor-blink 0.8s step-end infinite',
            }}
          />
        )}
      </span>
    )
  },
)
