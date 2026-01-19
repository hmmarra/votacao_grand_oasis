'use client'

import React from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Footer } from '@/components/Footer'

export default function SobrePage() {
    return (
        <div className="min-h-screen flex bg-transparent">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 w-full px-4 pt-24 lg:pt-10 pb-10">
                    <div className="w-full max-w-[1600px] mx-auto flex flex-col justify-center">

                        {/* Grid Container */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                            {/* 1. Main Platform Card (Top Left) */}
                            <div className="xl:col-span-2 h-full">
                                <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-5 shadow-2xl h-full flex flex-col relative overflow-hidden">
                                    {/* Watermark Icon */}
                                    <div className="absolute -top-12 -left-12 opacity-[0.05] pointer-events-none select-none rotate-12">
                                        <svg className="w-80 h-80 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>

                                    <div className="flex flex-col gap-6 flex-1 relative z-10">
                                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                                            {/* Logo / Brand Section */}
                                            <div className="flex-shrink-0 text-center sm:text-left mt-2 ml-2">
                                                <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Meu Condomínio</h1>
                                                <p className="text-slate-400 text-sm font-medium">Versão 1.0.0</p>
                                            </div>

                                            {/* Description */}
                                            <div className="flex-1">
                                                <h2 className="text-xl font-bold text-white mb-3 text-center sm:text-left">Sobre a Plataforma</h2>
                                                <p className="text-slate-300 leading-relaxed text-sm text-center sm:text-left text-justify">
                                                    O <strong className="text-cyan-400">Meu Condomínio</strong> é uma solução moderna e intuitiva projetada para transformar a gestão condominial.
                                                    Com foco na transparência e participação, nossa plataforma facilita assembleias virtuais, gestão de moradores e comunicação eficiente entre administração e residentes.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
                                            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 hover:border-cyan-500/30 transition-colors group">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold text-sm mb-1">Votação Segura</h3>
                                                        <p className="text-slate-400 text-xs">Sistema de votação transparente com rastreabilidade e segurança.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 hover:border-cyan-500/30 transition-colors group">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold text-sm mb-1">Gestão de Moradores</h3>
                                                        <p className="text-slate-400 text-xs">Controle total sobre o cadastro de moradores e unidades.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 hover:border-cyan-500/30 transition-colors group">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold text-sm mb-1">Resultados em Tempo Real</h3>
                                                        <p className="text-slate-400 text-xs">Acompanhe o andamento das votações com gráficos interativos.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 hover:border-cyan-500/30 transition-colors group">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold text-sm mb-1">Alta Performance</h3>
                                                        <p className="text-slate-400 text-xs">Interface rápida e responsiva, construída com as mais recentes tecnologias.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Developer Card (Top Right) */}
                            <div className="xl:col-span-1 h-full">
                                <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-cyan-500/30 transition-colors h-full flex flex-col justify-center">
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl group-hover:bg-cyan-500/20 transition-colors"></div>

                                    <h3 className="text-lg font-bold text-white mb-4 relative z-10 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                        </svg>
                                        Desenvolvedor
                                    </h3>

                                    <div className="text-center relative z-10">
                                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-slate-700 to-slate-600 border-4 border-slate-800 flex items-center justify-center mb-4 overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
                                            <img
                                                src="/img/dev.png"
                                                alt="Luis Marra"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback se a imagem não carregar
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.parentElement!.innerHTML = '<span class="text-3xl font-bold text-slate-300">LM</span>';
                                                }}
                                            />
                                        </div>
                                        <h4 className="text-xl font-bold text-white">Luis Marra</h4>
                                        <p className="text-cyan-400 text-sm font-medium mb-3">Full Stack Developer</p>

                                        <div className="flex items-center justify-center gap-2 mb-4 text-slate-400 text-sm bg-slate-800/50 py-1.5 px-3 rounded-lg border border-slate-700/50 w-fit mx-auto">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                            </svg>
                                            <span className="font-medium">11 95339-5665</span>
                                        </div>

                                        <div className="flex justify-center gap-4">
                                            <a href="https://github.com/hmmarra" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-slate-900 hover:bg-black text-slate-400 hover:text-white transition-all border border-slate-700 hover:border-slate-500 group-hover:scale-110">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                                </svg>
                                            </a>
                                            <a href="https://linkedin.com/in/luis-marra" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-slate-900 hover:bg-[#0077b5] text-slate-400 hover:text-white transition-all border border-slate-700 hover:border-slate-500 group-hover:scale-110">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Tech Stack (Bottom Left) */}
                            <div className="xl:col-span-2 h-full">
                                <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-5 shadow-xl h-full flex flex-col justify-center">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                        </svg>
                                        Tecnologias Utilizadas
                                    </h3>
                                    <div className="flex flex-wrap gap-8 justify-center items-center">
                                        {[
                                            {
                                                name: 'Next.js 16',
                                                color: 'group-hover:text-white',
                                                icon: (
                                                    <svg className="w-8 h-8" viewBox="0 0 180 180" fill="currentColor">
                                                        <mask height="180" id="mask0_next" maskUnits="userSpaceOnUse" width="180" x="0" y="0" style={{ maskType: 'alpha' }}>
                                                            <circle cx="90" cy="90" fill="black" r="90"></circle>
                                                        </mask>
                                                        <g mask="url(#mask0_next)">
                                                            <circle cx="90" cy="90" data-circle="true" fill="currentColor" r="90"></circle>
                                                            <path d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z" fill="white"></path>
                                                            <rect fill="currentColor" height="72" width="12" x="115" y="54"></rect>
                                                        </g>
                                                    </svg>
                                                )
                                            },
                                            {
                                                name: 'React',
                                                color: 'group-hover:text-[#61DAFB]',
                                                icon: (
                                                    <svg className="w-8 h-8" viewBox="-10.5 -9.45 21 18.9" fill="currentColor">
                                                        <circle cx="0" cy="0" r="2" fill="currentColor"></circle>
                                                        <g stroke="currentColor" strokeWidth="1" fill="none">
                                                            <ellipse rx="10" ry="4.5"></ellipse>
                                                            <ellipse rx="10" ry="4.5" transform="rotate(60)"></ellipse>
                                                            <ellipse rx="10" ry="4.5" transform="rotate(120)"></ellipse>
                                                        </g>
                                                    </svg>
                                                )
                                            },
                                            {
                                                name: 'TypeScript',
                                                color: 'group-hover:text-[#3178C6]',
                                                icon: (
                                                    <svg className="w-8 h-8 rounded" viewBox="0 0 128 128" fill="currentColor">
                                                        <path d="M2.5 2.5h123v123h-123z" fill="#3178C6" className="text-[#3178C6]"></path>
                                                        <path d="M70.4 92.2c-4.5 4.8-10.4 7.6-18.3 7.6-17.3 0-21.7-13.4-21.7-27 0-12.8 5.7-25 21.3-25 7 0 12.5 2 17 6.3l9-10.8c-7-7-15.6-10.3-26-10.3-26.4 0-38 18-38 40s10.6 42 39 42c12 0 21.6-4.6 28-12.4l-10.3-10.4zm23.6-26.2c0-5-3-7.5-9.3-7.5-3.8 0-7 .6-10.5 2v-12c3.5-1 7.2-1.5 10.7-1.5 17 0 23.4 8 23.4 20.8V113h14.7v-9.6h.4c3.4 5.3 9.4 11 18.6 11 14.5 0 22-10 22-29V66h-15.3v39c0 8.4-2.2 13-9 13-5.2 0-8-3-8-9.8V66H94v26.2z" fill="white"></path>
                                                    </svg>
                                                )
                                            },
                                            {
                                                name: 'Tailwind CSS',
                                                color: 'group-hover:text-[#38B2AC]',
                                                icon: (
                                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z" />
                                                    </svg>
                                                )
                                            },
                                            {
                                                name: 'Firebase',
                                                color: 'group-hover:text-[#FFCA28]',
                                                icon: (
                                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M3.89 15.672L6.255 3.061c.14-.749 1.18-.867 1.488-.17L10.2 10.318l-6.31 5.354zm16.147.247L15.93 1.954c-.26-.826-1.428-.847-1.717-.03L10.97 11.96l9.067 3.959z" fill="#FFA000" />
                                                        <path d="M10.2 10.318l2.923-2.905c.489-.487 1.284-.465 1.742.047l1.066 1.193 4.106 1.793-9.837-5.482z" fill="#FFCA28" />
                                                        <path d="M10.97 11.96L3.89 15.672c-.886.465-1.006 1.712-.218 2.345l8.156 6.556c.643.517 1.568.508 2.22-.023l7.989-6.495c.783-.637.66-1.884-.228-2.345l-4.106-1.792-6.732-5.462z" fill="#F57F17" />
                                                    </svg>
                                                )
                                            },
                                            {
                                                name: 'Lucide Icons',
                                                color: 'group-hover:text-red-400',
                                                icon: (
                                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                                                        <line x1="16" y1="8" x2="2" y2="22"></line>
                                                        <line x1="17.5" y1="15" x2="9" y2="15"></line>
                                                    </svg>
                                                )
                                            },
                                            {
                                                name: 'XLSX',
                                                color: 'group-hover:text-green-400',
                                                icon: (
                                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                        <polyline points="14 2 14 8 20 8"></polyline>
                                                        <line x1="8" y1="13" x2="16" y2="13"></line>
                                                        <line x1="8" y1="17" x2="16" y2="17"></line>
                                                        <polyline points="10 9 9 9 8 9"></polyline>
                                                    </svg>
                                                )
                                            }
                                        ].map((tech) => (
                                            <div
                                                key={tech.name}
                                                className={`group relative flex items-center justify-center transition-all duration-300 hover:scale-110 text-slate-500 hover:text-slate-300 ${tech.color}`}
                                                role="img"
                                                aria-label={tech.name}
                                            >
                                                {tech.icon}
                                                <span className="absolute -bottom-10 scale-0 transition-all rounded-lg bg-slate-900/90 px-3 py-2 text-xs text-white group-hover:scale-100 whitespace-nowrap border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 font-medium z-50 pointer-events-none">
                                                    {tech.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 4. Status Card (Bottom Right) */}
                            <div className="xl:col-span-1 h-full">
                                <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-cyan-500/20 rounded-3xl p-5 shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-cyan-500/20 blur-2xl"></div>
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2 relative z-10">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                                        </span>
                                        Status do Sistema
                                    </h3>
                                    <div className="space-y-3 relative z-10">
                                        <div className="flex justify-between items-center text-sm border-b border-cyan-500/10 pb-2">
                                            <span className="text-cyan-200">Servidores</span>
                                            <span className="text-cyan-400 font-medium">Online</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-cyan-200">Banco de Dados</span>
                                            <span className="text-cyan-400 font-medium">Conectado</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
                    <Footer />
                </div>
            </div>
        </div>
    )
}
