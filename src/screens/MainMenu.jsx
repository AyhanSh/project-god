'use client'

import { motion } from 'framer-motion'

function seededRandom(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

export default function MainMenu({ onStartGame, onStartSandbox }) {
  const containerStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Georgia', serif",
    color: '#e0d0c0',
  }

  const btnBase = {
    padding: '16px 56px',
    background: 'transparent',
    color: '#c0b0e0',
    fontSize: '1rem',
    letterSpacing: '0.15em',
    cursor: 'pointer',
    fontFamily: "'Georgia', serif",
    transition: 'all 0.3s ease',
    width: '280px',
    textAlign: 'center',
  }

  return (
    <div style={containerStyle}>
      {/* Background particles */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3 + seededRandom(i + 1) * 4,
              repeat: Infinity,
              delay: seededRandom(i + 31) * 3,
            }}
            style={{
              position: 'absolute',
              width: '2px',
              height: '2px',
              borderRadius: '50%',
              background: '#6B5CE7',
              left: `${(seededRandom(i + 61) * 100).toFixed(2)}%`,
              top: `${(seededRandom(i + 91) * 100).toFixed(2)}%`,
            }}
          />
        ))}
      </div>

      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
        style={{
          fontSize: '4rem',
          fontWeight: 300,
          letterSpacing: '0.3em',
          color: '#f0e0c8',
          textShadow: '0 0 40px rgba(200,180,140,0.3)',
          marginBottom: '1rem',
        }}
      >
        PROJECT GOD
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.8, duration: 1 }}
        style={{
          fontSize: '0.9rem',
          letterSpacing: '0.2em',
          marginBottom: '4rem',
          color: '#a09080',
        }}
      >
        Real minds. Real lives. Real world.
      </motion.p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        alignItems: 'center',
      }}>
        {/* Begin Creation */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          whileHover={{
            background: '#6B5CE720',
            borderColor: '#9C27B0',
            scale: 1.05,
          }}
          whileTap={{ scale: 0.95 }}
          onClick={onStartGame}
          style={{
            ...btnBase,
            border: '1px solid #6B5CE7',
          }}
        >
          BEGIN CREATION
        </motion.button>

        {/* Sandbox Mode */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          whileHover={{
            background: '#4fc3f720',
            borderColor: '#4fc3f7',
            scale: 1.05,
          }}
          whileTap={{ scale: 0.95 }}
          onClick={onStartSandbox}
          style={{
            ...btnBase,
            border: '1px solid rgba(79, 195, 247, 0.5)',
            color: '#90caf9',
          }}
        >
          SANDBOX MODE
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          style={{
            fontSize: '0.7rem',
            color: '#706050',
            letterSpacing: '0.1em',
            marginTop: '0.5rem',
          }}
        >
          Sandbox: test all features on a flat plane world
        </motion.p>
      </div>
    </div>
  )
}
