'use client'

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Era clothing palettes ────────────────────────────────────────────────────
const ERA_CLOTH = {
  ancient:      { primary: '#c4a46a', secondary: '#a48444', belt: '#8a6030', shoe: '#7a5020' },
  medieval:     { primary: '#6a7a8a', secondary: '#4a5a6a', belt: '#3a2a1a', shoe: '#2a1a0a' },
  renaissance:  { primary: '#d4c4a4', secondary: '#b4a484', belt: '#8a6040', shoe: '#4a2a10' },
  industrial:   { primary: '#4a4a4a', secondary: '#3a3a3a', belt: '#2a1a0a', shoe: '#1a0a0a' },
  modern:       { primary: '#3a6ab0', secondary: '#2a4a90', belt: '#1a1a1a', shoe: '#0a0a0a' },
  singularity:  { primary: '#7040b0', secondary: '#5020a0', belt: '#9060d0', shoe: '#402080' },
}

// ─── Default skin tone (used when soul has no skinTone field) ────────────────
const DEFAULT_SKIN = '#c8a882'

// ─── Build human mesh group (imperative Three.js — called once per soul) ──────
function buildHuman(skinColor, hairColor, cloth, aura, era) {
  const group = new THREE.Group()

  const skinMat  = new THREE.MeshLambertMaterial({ color: skinColor })
  const clothMat = new THREE.MeshLambertMaterial({ color: cloth.primary })
  const cloth2   = new THREE.MeshLambertMaterial({ color: cloth.secondary })
  const hairMat  = new THREE.MeshLambertMaterial({ color: hairColor })
  const beltMat  = new THREE.MeshLambertMaterial({ color: cloth.belt })
  const shoeMat  = new THREE.MeshLambertMaterial({ color: cloth.shoe })
  const eyeMat   = new THREE.MeshLambertMaterial({ color: 0x111111 })
  const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff })

  // HEAD
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.28), skinMat)
  head.position.set(0, 1.72, 0)
  head.castShadow = true
  group.add(head)

  // HAIR top
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.30), hairMat)
  hair.position.set(0, 1.94, 0)
  group.add(hair)

  // Hair sides
  for (const x of [-0.17, 0.17]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.28), hairMat)
    side.position.set(x, 1.80, 0)
    group.add(side)
  }

  // EYES
  for (const x of [-0.08, 0.08]) {
    const eyeWhite = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.04), whiteMat)
    eyeWhite.position.set(x, 1.73, 0.14)
    group.add(eyeWhite)
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.04), eyeMat)
    eye.position.set(x, 1.73, 0.15)
    group.add(eye)
  }

  // NOSE
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.06), skinMat)
  nose.position.set(0, 1.66, 0.15)
  group.add(nose)

  // NECK
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 6), skinMat)
  neck.position.set(0, 1.52, 0)
  group.add(neck)

  // TORSO
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.22), clothMat)
  torso.position.set(0, 1.18, 0)
  torso.castShadow = true
  group.add(torso)

  // BELT
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.24), beltMat)
  belt.position.set(0, 0.92, 0)
  group.add(belt)

  // HIPS
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.22, 0.20), cloth2)
  hips.position.set(0, 0.78, 0)
  group.add(hips)

  // ERA-SPECIFIC extras
  if (era === 'ancient') {
    const drape = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.54, 0.10), clothMat)
    drape.position.set(0.05, 1.18, 0.14)
    group.add(drape)
  }
  if (era === 'medieval') {
    for (const x of [-0.28, 0.28]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.10, 0.24), cloth2)
      pad.position.set(x, 1.36, 0)
      group.add(pad)
    }
  }
  if (era === 'singularity') {
    const panelMat = new THREE.MeshLambertMaterial({
      color: aura,
      emissive: new THREE.Color(aura),
      emissiveIntensity: 0.5,
    })
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.18, 0.08), panelMat)
    chest.position.set(0, 1.22, 0.13)
    group.add(chest)
  }

  // ARMS
  const arms = {}
  for (const side of ['L', 'R']) {
    const x = side === 'L' ? -0.30 : 0.30
    const armGroup = new THREE.Group()
    armGroup.position.set(x, 1.30, 0)

    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.34, 6), clothMat)
    upper.position.set(0, -0.17, 0)
    armGroup.add(upper)

    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.075, 6, 6), skinMat)
    elbow.position.set(0, -0.36, 0)
    armGroup.add(elbow)

    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.30, 6), skinMat)
    lower.position.set(0, -0.53, 0)
    armGroup.add(lower)

    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.12, 0.07), skinMat)
    hand.position.set(0, -0.72, 0)
    armGroup.add(hand)

    group.add(armGroup)
    arms[side] = armGroup
  }

  // HELD TOOLS (attached to right arm, shown only during relevant animations)
  const woodMat = new THREE.MeshLambertMaterial({ color: '#6b4226' })
  const metalMat = new THREE.MeshLambertMaterial({ color: '#8a8a8a' })

  // Axe — handle + forward-facing blade
  const axeGroup = new THREE.Group()
  axeGroup.position.set(0, -0.68, 0.06)
  const axeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 5), woodMat)
  axeHandle.position.set(0, -0.22, 0)
  axeGroup.add(axeHandle)
  const axeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.11, 0.16), metalMat)
  axeBlade.position.set(0, -0.43, -0.07)
  axeGroup.add(axeBlade)
  axeGroup.visible = false
  arms.R.add(axeGroup)

  // Pickaxe — handle + forward-facing head + pick point
  const pickGroup = new THREE.Group()
  pickGroup.position.set(0, -0.68, 0.06)
  const pickHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 5), woodMat)
  pickHandle.position.set(0, -0.24, 0)
  pickGroup.add(pickHandle)
  const pickHead = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.26), metalMat)
  pickHead.position.set(0, -0.48, 0)
  pickGroup.add(pickHead)
  const pickTip = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.09, 4), metalMat)
  pickTip.position.set(0, -0.48, -0.17)
  pickTip.rotation.x = -Math.PI / 2
  pickGroup.add(pickTip)
  pickGroup.visible = false
  arms.R.add(pickGroup)

  // Hammer — short handle + rectangular head
  const hammerGroup = new THREE.Group()
  hammerGroup.position.set(0, -0.68, 0.06)
  const hammerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 5), woodMat)
  hammerHandle.position.set(0, -0.16, 0)
  hammerGroup.add(hammerHandle)
  const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.14), metalMat)
  hammerHead.position.set(0, -0.32, 0)
  hammerGroup.add(hammerHead)
  hammerGroup.visible = false
  arms.R.add(hammerGroup)

  // LEGS
  const legs = {}
  for (const side of ['L', 'R']) {
    const x = side === 'L' ? -0.12 : 0.12
    const legGroup = new THREE.Group()
    legGroup.position.set(x, 0.66, 0)

    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.085, 0.40, 6), cloth2)
    upper.position.set(0, -0.20, 0)
    legGroup.add(upper)

    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), cloth2)
    knee.position.set(0, -0.41, 0)
    legGroup.add(knee)

    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.06, 0.38, 6), cloth2)
    lower.position.set(0, -0.60, 0)
    legGroup.add(lower)

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.10, 0.20), shoeMat)
    shoe.position.set(0, -0.83, 0.04)
    legGroup.add(shoe)

    group.add(legGroup)
    legs[side] = legGroup
  }

  return { group, head, arms, legs, torso, axe: axeGroup, pickaxe: pickGroup, hammer: hammerGroup }
}

// ─── Dispose all geometries and materials in a group ─────────────────────────
function disposeGroup(group) {
  group.traverse((child) => {
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose())
      } else {
        child.material.dispose()
      }
    }
  })
}

// ─── Animation logic (from CharacterTest.jsx / WorldTest.html) ───────────────
function animateHuman(parts, animName, t) {
  const { head, arms, legs, torso, group } = parts
  if (!arms.L || !arms.R || !legs.L || !legs.R) return

  // Reset all rotations each frame
  for (const p of [arms.L, arms.R, legs.L, legs.R, head]) {
    if (p) { p.rotation.x = 0; p.rotation.z = 0; p.rotation.y = 0 }
  }
  if (group) { group.position.y = 0; group.rotation.x = 0; group.rotation.y = 0; group.rotation.z = 0 }

  // Toggle held tools
  if (parts.axe) parts.axe.visible = (animName === 'chop_tree')
  if (parts.pickaxe) parts.pickaxe.visible = (animName === 'mine')
  if (parts.hammer) parts.hammer.visible = (animName === 'build')

  switch (animName) {
    case 'idle': {
      const breathe = Math.sin(t * 1.2) * 0.015
      if (torso) torso.scale.y = 1 + breathe
      arms.L.rotation.z = 0.05 + Math.sin(t * 0.8) * 0.03
      arms.R.rotation.z = -0.05 - Math.sin(t * 0.8) * 0.03
      head.rotation.y = Math.sin(t * 0.3) * 0.12
      head.rotation.x = Math.sin(t * 0.5) * 0.03
      break
    }
    case 'walk': {
      const swing = Math.sin(t * 4)
      arms.L.rotation.x = swing * 0.55
      arms.R.rotation.x = -swing * 0.55
      legs.L.rotation.x = -swing * 0.65
      legs.R.rotation.x = swing * 0.65
      group.position.y = Math.abs(Math.sin(t * 8)) * 0.04
      head.rotation.x = -0.05
      break
    }
    case 'work': {
      arms.L.rotation.x = -0.6 + Math.sin(t * 5) * 0.5
      arms.R.rotation.x = -0.4 - Math.sin(t * 5) * 0.4
      arms.L.rotation.z = 0.3
      arms.R.rotation.z = -0.3
      group.position.y = Math.sin(t * 5) * 0.02
      head.rotation.x = 0.2
      break
    }
    case 'pray': {
      arms.L.rotation.x = -1.2
      arms.R.rotation.x = -1.2
      arms.L.rotation.z = 0.35
      arms.R.rotation.z = -0.35
      legs.L.rotation.x = 0.45
      legs.R.rotation.x = 0.45
      group.position.y = 0
      head.rotation.x = 0.35 + Math.sin(t * 1.2) * 0.05
      break
    }
    case 'fight': {
      const punch = Math.sin(t * 6)
      arms.L.rotation.x = -0.8 + punch * 0.7
      arms.R.rotation.x = -0.8 - punch * 0.7
      arms.L.rotation.z = 0.4
      arms.R.rotation.z = -0.4
      legs.L.rotation.x = -0.2
      legs.R.rotation.x = 0.2
      group.rotation.y = Math.sin(t * 3) * 0.15
      group.position.y = Math.abs(Math.sin(t * 6)) * 0.04
      head.rotation.y = Math.sin(t * 3) * 0.1
      break
    }
    case 'celebrate': {
      const jump = Math.abs(Math.sin(t * 3))
      group.position.y = jump * 0.25
      arms.L.rotation.x = -2.0 + Math.sin(t * 3) * 0.3
      arms.R.rotation.x = -2.0 - Math.sin(t * 3) * 0.3
      arms.L.rotation.z = 0.5
      arms.R.rotation.z = -0.5
      group.rotation.y = t * 1.5
      head.rotation.z = Math.sin(t * 4) * 0.15
      break
    }
    case 'swim': {
      // Body face-down horizontal, freestyle crawl stroke
      group.rotation.x = Math.PI / 2 - 0.25  // face-down, head slightly raised
      group.position.y = 0.3  // float above group origin (water surface)

      const stroke = Math.sin(t * 3.5)
      const kick = Math.sin(t * 6)

      // Alternating arm crawl
      arms.L.rotation.x = -0.8 + stroke * 1.0
      arms.R.rotation.x = -0.8 - stroke * 1.0
      arms.L.rotation.z = 0.4
      arms.R.rotation.z = -0.4

      // Flutter kick
      legs.L.rotation.x = kick * 0.4
      legs.R.rotation.x = -kick * 0.4

      // Head turns to breathe
      head.rotation.y = Math.sin(t * 1.75) * 0.3
      head.rotation.x = -0.4  // look forward (relative to tilted body)
      break
    }
    case 'talk': {
      // Standing, gesturing hands, head nodding — conversation animation
      const gesture = Math.sin(t * 2.5)
      const nod = Math.sin(t * 1.8)
      // Right arm gestures up and down
      arms.R.rotation.x = -0.7 + gesture * 0.4
      arms.R.rotation.z = -0.25
      // Left arm smaller complementary gesture
      arms.L.rotation.x = -0.4 - gesture * 0.2
      arms.L.rotation.z = 0.2
      // Head nods and tilts
      head.rotation.x = nod * 0.12
      head.rotation.y = Math.sin(t * 1.2) * 0.15
      head.rotation.z = Math.sin(t * 0.9) * 0.06
      // Slight weight shift
      group.position.y = Math.abs(Math.sin(t * 1.5)) * 0.01
      break
    }
    case 'sleep': {
      arms.L.rotation.z = 0.3
      arms.R.rotation.z = -0.3
      head.rotation.z = 0.2
      head.rotation.x = 0.1
      break
    }
    case 'chop_tree': {
      const chop = Math.sin(t * 3)
      // Only right arm swings (holding axe)
      arms.R.rotation.x = -1.0 + chop * 0.7
      arms.L.rotation.z = 0.08
      if (torso) torso.rotation.x = -chop * 0.15
      legs.L.rotation.x = 0.1
      legs.R.rotation.x = 0.1
      group.position.y = Math.max(0, -chop * 0.05)
      break
    }
    case 'mine': {
      group.position.y = 0
      // Only right arm swings (holding pickaxe)
      arms.R.rotation.x = -0.8 + Math.sin(t * 2.5) * 0.9
      arms.L.rotation.z = 0.08
      if (torso) torso.rotation.x = -0.3 + Math.sin(t * 2.5) * 0.1
      head.rotation.x = 0.2
      break
    }
    case 'craft': {
      arms.L.rotation.x = -0.6 + Math.sin(t * 4) * 0.3
      arms.R.rotation.x = -0.6 + Math.sin(t * 4 + 0.5) * 0.3
      arms.L.rotation.z = -0.2
      arms.R.rotation.z = 0.2
      if (torso) torso.rotation.x = -0.15
      head.rotation.x = 0.1
      break
    }
    case 'build': {
      // Hammering motion: right arm swings down with hammer, left steadies
      const hammer = Math.sin(t * 4)
      // Right arm: overhead swing down (holding hammer)
      arms.R.rotation.x = -1.4 + hammer * 0.8
      arms.R.rotation.z = -0.15
      // Left arm: holds material in place / steadies
      arms.L.rotation.x = -0.7 + Math.sin(t * 2) * 0.15
      arms.L.rotation.z = 0.25
      // Torso leans forward into the strike
      if (torso) torso.rotation.x = -0.15 + hammer * 0.08
      // Legs planted, slight weight shift
      legs.L.rotation.x = 0.08
      legs.R.rotation.x = -0.04
      // Head looks slightly up at the structure
      head.rotation.x = -0.15 + Math.sin(t * 1.5) * 0.05
      // Small body bob on each hammer strike
      group.position.y = Math.max(0, -hammer * 0.03)
      break
    }
    case 'greet': {
      // Right arm raised high, waving side to side
      const wave = Math.sin(t * 3.5)
      arms.R.rotation.x = -2.6                   // arm straight up
      arms.R.rotation.z = -0.15 + wave * 0.25    // gentle wave, centered closer to body
      // Left arm relaxed at side
      arms.L.rotation.z = 0.08
      arms.L.rotation.x = 0.05
      // Slight body lean and head tilt toward the person being greeted
      head.rotation.y = 0.15
      head.rotation.z = Math.sin(t * 2) * 0.08
      if (torso) torso.rotation.z = 0.06
      // Small weight shift
      group.position.y = Math.abs(Math.sin(t * 2)) * 0.02
      break
    }
    default: {
      const breathe2 = Math.sin(t * 1.2) * 0.015
      if (torso) torso.scale.y = 1 + breathe2
      head.rotation.y = Math.sin(t * 0.3) * 0.12
      break
    }
  }
}

// ─── React Three Fiber component ─────────────────────────────────────────────
export default function HumanModel({
  position = [0, 0, 0],
  era = 'ancient',
  aura = '#6B5CE7',
  animation = 'idle',
  selected = false,
  age = 25,
  soulId = '',
  skinTone,
  onClick,
}) {
  const outerRef = useRef()
  const partsRef = useRef(null)
  const animRef = useRef(animation)
  const timeRef = useRef(0)

  // Keep animation ref in sync (useEffect is React Compiler-safe)
  useEffect(() => {
    animRef.current = animation
  }, [animation])

  // Build + attach the Three.js human group via useEffect (no <primitive>)
  useEffect(() => {
    const parent = outerRef.current
    if (!parent) return

    const cloth = ERA_CLOTH[era] || ERA_CLOTH.ancient
    const skinColor = skinTone || DEFAULT_SKIN
    const hairColor = age > 60 ? '#aaaaaa' : '#2a1a0a'

    const parts = buildHuman(skinColor, hairColor, cloth, aura, era)
    parent.add(parts.group)
    partsRef.current = parts

    return () => {
      parent.remove(parts.group)
      disposeGroup(parts.group)
      partsRef.current = null
    }
  }, [era, skinTone, aura, age > 60])

  const ageScale = age < 16 ? 0.6 + (age / 16) * 0.4 : 1.0

  // Animate every frame — manual time accumulation (avoids deprecated THREE.Clock)
  useFrame((_state, delta) => {
    const parts = partsRef.current
    if (!parts) return
    timeRef.current += delta
    animateHuman(parts, animRef.current, timeRef.current)
  })

  return (
    <group
      ref={outerRef}
      position={position}
      scale={[ageScale, ageScale, ageScale]}
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
    >
      {/* Human mesh attached via useEffect above */}

      {/* Soul aura glow */}
      <pointLight
        position={[0, 1.2, 0.5]}
        color={aura}
        intensity={selected ? 2.0 : 0.4}
        distance={selected ? 5 : 2}
      />

      {/* Selection ring */}
      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color={aura} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
