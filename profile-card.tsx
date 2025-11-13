"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { MapPin } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ProfileCard() {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 })
  const [targetTilt, setTargetTilt] = useState({ x: 0, y: 0 })
  const [isFlipping, setIsFlipping] = useState(false)
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)

  const cardContainerRef = useRef<HTMLDivElement>(null)
  const backCardRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const lastUpdateTimeRef = useRef<number>(0)

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      setIsCoarsePointer(window.matchMedia("(pointer: coarse)").matches)
    }
  }, [])

  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor
  }

  const updateTilt = useCallback(() => {
    const now = performance.now()
    const deltaTime = now - lastUpdateTimeRef.current
    lastUpdateTimeRef.current = now

    if (isFlipping) {
      setCardTilt({ x: 0, y: 0 })
      setTargetTilt({ x: 0, y: 0 })
      return
    }

    setCardTilt((current) => {
      const lerpFactor = Math.min(deltaTime / 16, 1) * 0.15
      const newX = lerp(current.x, targetTilt.x, lerpFactor)
      const newY = lerp(current.y, targetTilt.y, lerpFactor)

      const threshold = 0.1
      return {
        x: Math.abs(newX - targetTilt.x) < threshold ? targetTilt.x : newX,
        y: Math.abs(newY - targetTilt.y) < threshold ? targetTilt.y : newY,
      }
    })

    if ((isHovered || isFlipped) && !isFlipping) {
      animationFrameRef.current = requestAnimationFrame(updateTilt)
    }
  }, [targetTilt, isFlipped, isFlipping, isHovered])

  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isFlipped && !isFlipping && cardContainerRef.current) {
        const rect = cardContainerRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const mouseX = e.clientX - centerX
        const mouseY = e.clientY - centerY

        const maxTilt = isCoarsePointer ? 6 : 15
        const tiltX = (mouseY / (rect.height / 2)) * maxTilt * -1
        const tiltY = (mouseX / (rect.width / 2)) * maxTilt

        const constrainedTiltX = Math.max(-maxTilt, Math.min(maxTilt, tiltX))
        const constrainedTiltY = Math.max(-maxTilt, Math.min(maxTilt, tiltY))
        setTargetTilt({ x: constrainedTiltX, y: constrainedTiltY })

        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setMousePosition({
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
        })
      }
    },
    [isFlipped, isFlipping, isCoarsePointer],
  )

  useEffect(() => {
    if (isFlipped) {
      document.addEventListener("mousemove", handleGlobalMouseMove, { passive: true })
    }
    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove)
    }
  }, [isFlipped, handleGlobalMouseMove])

  useEffect(() => {
    if ((isHovered || isFlipped) && !isFlipping) {
      lastUpdateTimeRef.current = performance.now()
      animationFrameRef.current = requestAnimationFrame(updateTilt)
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isHovered, isFlipped, isFlipping, updateTilt])

  const handleCardClick = () => {
    setIsFlipping(true)
    setIsFlipped((v) => !v)
    setTimeout(() => setIsFlipping(false), 600)
  }

  const handleMouseEnter = () => setIsHovered(true)

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (!isFlipped) {
      setMousePosition({ x: 50, y: 50 })
      setCardTilt({ x: 0, y: 0 })
      setTargetTilt({ x: 0, y: 0 })
    }
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!cardContainerRef.current) return
      const rect = cardContainerRef.current.getBoundingClientRect()

      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setMousePosition({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      })

      if (!isFlipped && isHovered && !isFlipping) {
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const mouseX = e.clientX - centerX
        const mouseY = e.clientY - centerY

        const maxTilt = isCoarsePointer ? 6 : 15
        const tiltX = (mouseY / (rect.height / 2)) * maxTilt * -1
        const tiltY = (mouseX / (rect.width / 2)) * maxTilt

        const constrainedTiltX = Math.max(-maxTilt, Math.min(maxTilt, tiltX))
        const constrainedTiltY = Math.max(-maxTilt, Math.min(maxTilt, tiltY))
        setTargetTilt({ x: constrainedTiltX, y: constrainedTiltY })
      }
    },
    [isFlipped, isHovered, isFlipping, isCoarsePointer],
  )

  const getTransform = () => {
    const flip = isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
    const tilt3D = !isFlipping && (isHovered || isFlipped) ? `rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)` : ""
    return `${flip} ${tilt3D}`
  }

  const getBackHolographicStyle = () => {
    if (!isFlipped) {
      return { background: "transparent", transition: "background 0.15s ease-out" }
    }

    const { x, y } = mousePosition
    const { x: tiltX, y: tiltY } = cardTilt
    const tiltIntensity = (Math.abs(tiltX) + Math.abs(tiltY)) / 30
    const colorIntensity = 0.7 + tiltIntensity * 0.3

    const tiltOffsetX = tiltY * 2
    const tiltOffsetY = tiltX * 2
    const adjustedX = Math.max(0, Math.min(100, x + tiltOffsetX))
    const adjustedY = Math.max(0, Math.min(100, y + tiltOffsetY))

    const g1 = `radial-gradient(circle at ${adjustedX}% ${adjustedY}%, rgba(117,160,155, ${colorIntensity}) 0%, transparent 50%)`
    const g2 = `radial-gradient(circle at ${100 - adjustedX}% ${100 - adjustedY}%, rgba(30,121,117, ${colorIntensity * 0.85}) 0%, transparent 40%)`
    const g3 = `radial-gradient(circle at ${adjustedX}% ${100 - adjustedY}%, rgba(60,110,121, ${colorIntensity * 0.9}) 0%, transparent 45%)`
    const g4 = `linear-gradient(${(x + tiltY) * 3.6}deg, rgba(117,160,155, ${colorIntensity * 0.6}), rgba(30,121,117, ${colorIntensity * 0.6}), rgba(3,58,83, ${colorIntensity * 0.7}))`

    return { background: `${g1}, ${g2}, ${g3}, ${g4}`, transition: "none" }
  }

  const getFrontHolographicStyle = () => {
    if (!isHovered || isFlipped) {
      return { background: "transparent", transition: "background 0.15s ease-out" }
    }

    const { x, y } = mousePosition
    const { x: tiltX, y: tiltY } = cardTilt
    const tiltIntensity = (Math.abs(tiltX) + Math.abs(tiltY)) / 30
    const colorIntensity = 0.35 + tiltIntensity * 0.25

    const tiltOffsetX = tiltY * 1.5
    const tiltOffsetY = tiltX * 1.5
    const adjustedX = Math.max(0, Math.min(100, x + tiltOffsetX))
    const adjustedY = Math.max(0, Math.min(100, y + tiltOffsetY))

    const g1 = `radial-gradient(circle at ${adjustedX}% ${adjustedY}%, rgba(117,160,155, ${colorIntensity}) 0%, transparent 48%)`
    const g2 = `radial-gradient(circle at ${100 - adjustedX}% ${100 - adjustedY}%, rgba(30,121,117, ${colorIntensity * 0.9}) 0%, transparent 40%)`
    const g3 = `radial-gradient(circle at ${adjustedX}% ${100 - adjustedY}%, rgba(60,110,121, ${colorIntensity * 0.85}) 0%, transparent 45%)`
    const g4 = `linear-gradient(${(x + tiltY) * 3.6}deg, rgba(117,160,155, ${colorIntensity * 0.5}), rgba(30,121,117, ${colorIntensity * 0.45}), rgba(3,58,83, ${colorIntensity * 0.55}))`

    return { background: `${g1}, ${g2}, ${g3}, ${g4}`, transition: "none" }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-sans"
      style={{ background: "linear-gradient(135deg, #033a53, #080b0d)" }}
    >
      <div className="relative w-full max-w-md mx-auto">
        <div
          ref={cardContainerRef}
          className="relative w-full h-[520px] sm:h-[560px] md:h-[600px] lg:h-[640px] cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: "preserve-3d",
              transform: getTransform(),
              transitionProperty: "transform",
              transitionDuration: "0.5s",
              transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            {/* ======= FRENTE ======= */}
            <Card
              className="absolute inset-0 w-full h-full bg-[#013147] border-[#3c6e79] overflow-hidden shadow-2xl rounded-xl"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(0deg)" }}
            >
              {/* Header más bajo en móvil para liberar espacio */}
              <div
                className="relative rounded-t-xl overflow-hidden h-28 sm:h-36 md:h-40"
                style={{
                  background:
                    "radial-gradient(circle at 0% 0%, #75a09b 0, #1e7975 40%, #033a53 80%, #080b0d 100%)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#013147]/70 to-transparent rounded-t-xl" />
                <div className="absolute inset-0 rounded-t-xl mix-blend-screen" style={getFrontHolographicStyle()} />
              </div>

              <CardHeader className="text-center -mt-14 sm:-mt-16 relative z-10 pb-3">
                <div className="relative">
                  <Avatar className="w-[96px] h-[96px] sm:w-[110px] sm:h-[110px] mx-auto mb-3 bg-[#080b0d] border border-[#75a09b]/40">
                    <AvatarImage
                      src="/images/nassat-profile.jpg"
                      alt="Ing. Arely Marroquín Hernández - Directora NASSAT"
                      className="object-cover"
                    />
                    {/* Fallback: imagen desde /images */}
                    <AvatarFallback className="bg-[#013147] text-[#75a09b] text-3xl p-0">
                      <img
                        src="/images/inge.jpg"
                        alt="Foto de perfil"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </AvatarFallback>
                  </Avatar>
                </div>

                <h1 className="text-lg sm:text-2xl font-bold text-slate-50 mb-1 text-balance">
                  ING. ARELY MARROQUÍN HERNÁNDEZ
                </h1>
                <p className="text-[11px] sm:text-sm text-[#75a09b] tracking-wide uppercase">
                  Directora General · NASSAT
                </p>

                <div className="flex items-center justify-center gap-2 mt-2 text-slate-200 text-[11px] sm:text-sm">
                  <MapPin className="w-4 h-4" style={{ color: "#75a09b" }} />
                  <span>San Diego, México</span>
                </div>
              </CardHeader>

              <CardContent className="px-6 pb-6 pt-2 relative">
                <div
                  className="absolute inset-0 rounded-b-xl mix-blend-soft-light opacity-40 pointer-events-none"
                  style={getFrontHolographicStyle()}
                />

                <ScrollArea className="relative z-10 max-h-[230px] sm:max-h-[270px] md:max-h-[310px] pr-2">
                  <div className="w-full h-px bg-[#3c6e79] my-4" />

                  <div className="space-y-1 text-[11px] sm:text-[13px] md:text-sm text-slate-100">
                    <p>
                      <span className="font-semibold text-[#75a09b]">Correo:</span>{" "}
                      amarroquin.hdz@outlook.com
                    </p>
                    <p>
                      <span className="font-semibold text-[#75a09b]">Correo alternativo:</span>{" "}
                      facturación.arelymh@outlook.com
                    </p>

                    <div className="mt-3 space-y-1">
                      <p>
                        <span className="font-semibold text-[#75a09b]">Teléfono personal:</span>{" "}
                        (+52) 55-35-34-97-57
                      </p>
                      <p>
                        <span className="font-semibold text-[#75a09b]">Teléfono administrativo:</span>{" "}
                        (+52) 56-13-86-68-88
                      </p>
                      <p>
                        <span className="font-semibold text-[#75a09b]">Teléfono oficina:</span>{" "}
                        (+52) 55-97-60-08-66
                      </p>
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex justify-center gap-3 relative z-10 mt-4">
                  <a
                    href="https://www.nassat.com.mx"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#75a09b]/60 text-slate-50 hover:bg-[#1e7975]/40 hover:border-[#75a09b] bg-transparent rounded-lg"
                    >
                      Sitio web
                    </Button>
                  </a>

                  <a
                    href="mailto:amarroquin.hdz@outlook.com"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#75a09b]/60 text-slate-50 hover:bg-[#1e7975]/40 hover:border-[#75a09b] bg-transparent rounded-lg"
                    >
                      Correo
                    </Button>
                  </a>

                  {/* Antes LinkedIn, ahora botón de llamada (tel:) */}
                  <a
                    href="tel:+525535349757"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#75a09b]/60 text-slate-50 hover:bg-[#1e7975]/40 hover:border-[#75a09b] bg-transparent rounded-lg"
                    >
                      Llamar
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* ======= REVERSO ======= */}
            <Card
              ref={backCardRef}
              className="absolute inset-0 w-full h-full bg-[#033a53] border-[#3c6e79] overflow-hidden shadow-2xl rounded-xl"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div
                className="h-full w-full rounded-xl relative"
                style={{
                  backgroundColor: "#033a53",
                  backgroundImage: "url(/images/nassat-logo.png)",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "contain",
                }}
              >
                <div
                  className="absolute inset-0 rounded-xl opacity-90 mix-blend-multiply pointer-events-none"
                  style={getBackHolographicStyle()}
                />
                <div
                  className="absolute inset-0 rounded-xl opacity-35 mix-blend-overlay pointer-events-none"
                  style={{
                    background: isFlipped
                      ? `linear-gradient(${(mousePosition.x + cardTilt.y) * 2}deg, 
                          transparent 30%, 
                          rgba(255, 255, 255, ${0.25 + Math.abs(cardTilt.x + cardTilt.y) / 120}) 50%, 
                          transparent 70%)`
                      : "transparent",
                    transition: "none",
                  }}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
