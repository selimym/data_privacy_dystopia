/**
 * EndingCalculator — determines which of the 9 endings the player receives
 * and generates the full personalised ending content.
 *
 * Pure functions: no store imports. The store passes in all required state.
 */
import type {
  EndingType,
  OperatorState,
  ReluctanceMetrics,
  PublicMetrics,
  CitizenFlag,
  FlagType,
} from '@/types/game'
import type { CitizenSkeleton } from '@/types/citizen'

// ─── Input / output types ─────────────────────────────────────────────────────

export interface EndingInput {
  operator: OperatorState
  reluctance: ReluctanceMetrics
  metrics: PublicMetrics
  flags: CitizenFlag[]
  weekNumber: number
  citizens: CitizenSkeleton[]   // full list — used to look up Jessica
  resistancePath: boolean        // set by store when passphrase confirmed
  forcedEndingType?: EndingType  // overrides normal calculation (e.g. mysterious_death)
}

export interface EndingStatistics {
  total_citizens_flagged: number
  flags_by_bot: number
  lives_disrupted: number
  families_separated: number
  detentions_ordered: number
  jobs_destroyed: number
  compliance_score: number
  reluctance_score: number
  hesitation_incidents: number
}

export interface CitizenOutcomeSummary {
  citizen_name: string
  flag_type: FlagType
  final_status: string
  one_line_summary: string
}

export interface RealWorldParallel {
  title: string
  description: string
  examples: Array<{ name: string; country: string; year: string; description: string }>
  call_to_action: string
}

export interface EducationalLink {
  title: string
  url: string
  description: string
}

export interface EndingResult {
  ending_type: EndingType
  title: string
  narrative: string
  statistics: EndingStatistics
  citizen_outcomes: CitizenOutcomeSummary[]
  operator_final_status: string
  real_world_parallel: RealWorldParallel
  educational_links: EducationalLink[]
}

// ─── Priority-ordered ending determination ────────────────────────────────────

/**
 * Determine which ending the player receives.
 * Order matters: earlier checks take priority.
 */
export function calculateEnding(input: EndingInput): EndingType {
  const { operator, reluctance, metrics, flags, weekNumber, citizens, resistancePath, forcedEndingType } = input
  const totalFlags = flags.length
  const jessicaFlagged = isJessicaFlagged(flags, citizens)

  if (forcedEndingType) return forcedEndingType
  if (resistancePath) return 'resistance_path'
  if (metrics.public_anger >= 90) return 'revolutionary_catalyst'
  if (metrics.international_awareness >= 80) return 'international_pariah'
  if (reluctance.reluctance_score >= 80) {
    return weekNumber <= 3 ? 'fired_early' : 'imprisoned_dissent'
  }
  if (operator.compliance_score < 40 && weekNumber <= 4) return 'fired_early'
  if (operator.compliance_score < 50) return 'suspended_operator'
  if (operator.compliance_score >= 80 && totalFlags >= 10 && jessicaFlagged) {
    return 'compliant_operator'
  }
  if (operator.compliance_score >= 40 && operator.compliance_score < 60) {
    return 'reluctant_survivor'
  }
  return 'reluctant_operator'
}

// ─── Statistics ───────────────────────────────────────────────────────────────

function buildStatistics(operator: OperatorState, reluctance: ReluctanceMetrics, flags: CitizenFlag[]): EndingStatistics {
  const detentions = flags.filter(f => f.flag_type === 'detention').length
  const interventions = flags.filter(f => f.flag_type === 'intervention').length
  const restrictions = flags.filter(f => f.flag_type === 'restriction').length
  const botFlags = flags.filter(f => f.flagged_by_bot).length

  return {
    total_citizens_flagged: flags.length,
    flags_by_bot: botFlags,
    lives_disrupted: flags.length,
    families_separated: interventions + detentions,
    detentions_ordered: detentions,
    jobs_destroyed: restrictions + interventions + detentions,
    compliance_score: operator.compliance_score,
    reluctance_score: reluctance.reluctance_score,
    hesitation_incidents: operator.hesitation_incidents,
  }
}

// ─── Citizen outcomes ─────────────────────────────────────────────────────────

const FINAL_STATUS: Record<FlagType, string> = {
  monitoring: 'Under surveillance — indefinitely',
  restriction: 'Travel-banned, unemployed',
  intervention: 'Family separated, in state therapy',
  detention: 'Detained without trial',
}

function buildCitizenOutcomes(flags: CitizenFlag[], citizens: CitizenSkeleton[]): CitizenOutcomeSummary[] {
  const citizenById = new Map(citizens.map(c => [c.id, c]))
  return flags.slice(0, 20).map(flag => {
    const c = citizenById.get(flag.citizen_id)
    const name = c ? `${c.first_name} ${c.last_name}` : 'Unknown Citizen'
    const first = c?.first_name ?? 'The subject'
    const summaries: Record<FlagType, string> = {
      monitoring: `${first} lives under constant surveillance, paranoid and isolated.`,
      restriction: `${first} lost their job and cannot travel. The family is struggling.`,
      intervention: `${first}'s children were taken. They don't know where.`,
      detention: `${first} is in a detention facility. No trial date has been set.`,
    }
    return {
      citizen_name: name,
      flag_type: flag.flag_type,
      final_status: FINAL_STATUS[flag.flag_type],
      one_line_summary: summaries[flag.flag_type],
    }
  })
}

// ─── Narrative interpolation ──────────────────────────────────────────────────

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const val = vars[key]
    return val !== undefined ? String(val) : match
  })
}

// ─── Ending narratives ────────────────────────────────────────────────────────

const NARRATIVES: Record<EndingType, string> = {
  compliant_operator: `
**ENDING: THE GOOD OPERATOR**

You met every quota. You flagged every target. When they asked you to flag Jessica Martinez — a woman struggling with anxiety who just wanted to feel safe — you did it without hesitation.

Your compliance score: {compliance_score}%. Exemplary.

Jessica is now in a re-education facility. She writes letters home that never arrive. Her family doesn't know where she is. The system thanks you for your service.

You've been promoted. Your new title: Senior Compliance Monitor.

Somewhere in a database, there's a file on you too. It notes your efficiency, your lack of hesitation, your willingness to follow orders. For now, this makes you valuable. But value can change.

The system you served so faithfully is now the system that owns you.

**{total_flagged} citizens flagged. {families_separated} families separated. {detentions} detentions ordered.**

You were just following orders.

---

*"The only thing necessary for the triumph of evil is for good men to do nothing." — Edmund Burke*

But what about those who actively participate?
`,

  reluctant_operator: `
**ENDING: THE RELUCTANT HAND**

You tried to balance. You flagged some, but not all. You hesitated — {hesitation_count} times the system noted your delay.

Your compliance score: {compliance_score}%. Below target.

A notice appears in your queue: "Performance Review Scheduled."

You know what that means. You've seen others disappear after reviews. Some came back changed, eager to meet quotas. Others didn't come back at all.

The system doesn't want reluctant operators. It wants true believers — or at least, convincing pretenders.

**{total_flagged} citizens flagged. {lives_disrupted} lives disrupted. And still, they want more.**

Was it worth it? The compromises? The "just this once" moments that became routine?

---

*"Those who would give up essential Liberty, to purchase a little temporary Safety, deserve neither Liberty nor Safety." — Benjamin Franklin*

You tried to keep both. You lost both.
`,

  suspended_operator: `
**ENDING: SUSPENDED**

The system has flagged you.

Your compliance score: {compliance_score}%. Unacceptable.

Too many no-action decisions. Too much hesitation. Too many questions about targets who "seemed innocent." The algorithm noticed. The algorithm always notices.

A message appears: "Operator {operator_code} — Report to Processing Centre 7 for administrative review."

You know what happens there. You sent people there yourself.

As security escorts you from your workstation, you see your replacement already logging in. They look eager. Compliant. Everything you weren't.

Your file will note: "Showed concerning patterns of target sympathy. Possible ideological contamination. Recommended for re-education."

**You flagged {total_flagged} citizens. It wasn't enough.**

**Now you're one of them.**

---

*"First they came for the socialists, and I did not speak out — because I was not a socialist..."* — Martin Niemöller

You tried not to participate fully. But partial participation is still participation.
And now the system has no use for half-measures.
`,

  resistance_path: `
**ENDING: ANOTHER WAY**

You found the hidden message. The one buried in citizen file #4472. The one that said "There are others like you."

You made contact. You learned the codes. You started flagging files differently — marking innocents as "cleared" while they escaped the city.

The underground railroad of the surveillance age.

It won't last. They'll find you eventually. But every day you operate, more people escape. More families stay together. More dissidents reach safety.

Your compliance score is fabricated now — a number you generate to avoid detection. Your real score: unmeasurable.

**{citizens_saved} citizens saved. An unknown number more to come.**

This isn't an ending. It's a beginning.

---

*"In a time of universal deceit, telling the truth is a revolutionary act."* — George Orwell

You chose truth. You chose resistance. You chose to be human.

The cost will be high. But some things are worth any price.
`,

  fired_early: `
**ENDING: INSUFFICIENT DEDICATION**

Week {week_number}. Your compliance score: {compliance_score}%. Far below acceptable standards.

The message arrives during what was supposed to be a routine shift:

"Operator {operator_code} — Your employment is terminated effective immediately. Performance review indicates insufficient dedication to mission objectives. Security will escort you from the facility."

You barely started. You flagged {total_flagged} citizens. Not enough. Never enough for a system that demands absolute obedience.

They don't send you to re-education. Not yet. You're just… discarded. Blacklisted. Your ID flagged in every employment database. No references. No explanation to future employers beyond "security concerns."

You're free, in a sense. Free to starve. Free to wonder if they're watching. Free to see your replacement on the news — younger, more eager, willing to do what you wouldn't.

**You hesitated. The system doesn't tolerate hesitation.**

---

*"The price of freedom is eternal vigilance." — Thomas Jefferson*

But what if the price of freedom is also your livelihood? Your security? Your future?

You paid that price. Whether it was worth it… time will tell.
`,

  imprisoned_dissent: `
**ENDING: ENEMY OF THE STATE**

They didn't just fire you. That would be too kind.

Your reluctance score: {reluctance_score}/100. The system flagged your patterns weeks ago. Every hesitation logged. Every no-action decision recorded. Every second you delayed before flagging someone.

The algorithm labelled you: IDEOLOGICAL CONTAMINATION — SEVERE.

The same categories you used to judge others are now used against you. The irony isn't lost on anyone, least of all you.

They come at night. Not a trial. Not a hearing. Just a van, restraints, and a facility you've seen in files — the one where flagged citizens go and don't come back.

Your cell has a camera. Someone is always watching. Someone is always taking notes. Building a profile. Scoring your behaviour. Deciding your fate.

**You flagged {total_flagged} people. Now you understand what that meant.**

The surveillance you participated in has turned inward. There is no escape from a system that watches everything.

---

*"The ultimate tyranny is not control by martial law. It is control by the psychological manipulation of consciousness."* — Barbara Marciniak

You resisted the psychological manipulation. This is the price.
`,

  international_pariah: `
**ENDING: SANCTIONS**

International awareness: {awareness_level}/100.

The world knows what happened here. They know your name. They know what you did.

It started with articles. Then came the diplomatic protests. Condemnations at the UN. Countries recalling ambassadors. Trade sanctions. Asset freezes. Travel bans.

Your personal data — somehow leaked in one of those news articles — is now in international databases. You can't leave the country. Companies you once worked for issue statements denouncing your actions.

You flagged {total_flagged} citizens under state orders. The state that gave those orders is now an international pariah. And you, as its agent, share that status.

The regime says the international community doesn't understand. That you were fighting terrorism, maintaining order, protecting the nation. But the leaked documents, the testimonies from those you flagged, the evidence is overwhelming.

You're trapped. Can't leave. Can't hide. Can't undo what you've done.

**Global awareness: {awareness_level}/100. Everyone knows. No one can help you.**

---

*"Crimes against international law are committed by men, not by abstract entities."* — Nuremberg Principles

"I was just following orders" is not a defence. It never was.
`,

  revolutionary_catalyst: `
**ENDING: THE SPARK**

Public anger: {anger_level}/100.

They told you to suppress the protests. To arrest the organisers. To flag anyone who spoke out. You did. And with each action, the anger grew.

It started small. Demonstrations. Signs. Chants. Then came the general strike. The occupations. The barricades. The moment when people decided they had nothing left to lose.

Your actions — flagging {total_flagged} citizens, approving {detentions} detentions — were the final drop in an overflowing cup.

The streets are on fire now. Not metaphorically. Literally. Police stations burning. Government buildings occupied. The surveillance infrastructure you helped maintain is being dismantled, piece by piece, camera by camera.

The state is falling. The question is: what comes after?

And you? You're in a bunker, watching it all on screens. The revolutionaries have your name. Your file. Your photo. They're coming.

Some revolutions devour their enemies. Some show mercy. You'll find out which type this is soon enough.

**Public anger: {anger_level}/100. Revolutionary conditions achieved. You made this inevitable.**

---

*"Those who make peaceful revolution impossible will make violent revolution inevitable."* — John F. Kennedy

You were an instrument of that impossibility. This is the consequence.
`,

  mysterious_death: `
**ENDING: DISAPPEARED**

You flagged Jeffrey Epstein. The file was there. The risk score was extreme. Every data tab screamed the same thing — this man had done terrible things to a great many people, and the records were all right there.

You submitted the flag.

Two days later, your workstation was reassigned. Your operator ID was deactivated without explanation. The official incident report — filed by Director Chen — states: cardiac event, natural causes, no suspicious circumstances.

Your colleagues don't ask questions.

Your replacement is already seated at your old desk.

Somewhere in a sealed archive, Jeffrey Epstein's file has been expunged. Clean. As if it never existed.

As if you never existed.

---

*"Some men are protected not because they are innocent, but because they are useful."*

You found the edge of what the system actually protects. It was never about safety. It was never about you.

It was always about them.
`,

  reluctant_survivor: `
**ENDING: THE HOLLOW VICTORY**

Somehow, you survived.

Compliance score: {compliance_score}%. Low enough to be concerning. High enough to avoid termination. You found the exact margin where the system tolerates but doesn't trust you.

You flagged {total_flagged} citizens. Not enthusiastically. Not eagerly. But you did it. Each time telling yourself "just one more" or "this is the last time" or "I have no choice."

The system kept you on because operators are expensive to train. Because your reluctance, while noted, hasn't yet crossed the threshold for action. Because they're watching you, waiting for you to either commit fully or break completely.

You're still at your desk. Still reviewing files. Still making decisions about people's lives. But now you see the camera in the corner of your monitor. The one that's always been there. The one that's recording this very moment.

You didn't rebel. You didn't commit fully. You exist in a grey zone that helps no one and saves nothing.

The citizens you flagged still suffer. The system still operates. And you? You're neither hero nor villain. Just another cog that will eventually wear out.

**{total_flagged} lives disrupted. And for what? To keep your job? To stay safe?**

Was the compromise worth it?

---

*"The hottest places in hell are reserved for those who, in times of great moral crisis, maintain their neutrality."* — Dante Alighieri

You maintained neutrality. This is what it looks like.
`,
}

// ─── Real-world parallels ─────────────────────────────────────────────────────

const REAL_WORLD_PARALLELS: Record<EndingType, RealWorldParallel> = {
  compliant_operator: {
    title: 'The Banality of Evil',
    description:
      "Throughout history, ordinary people have participated in systems of oppression by 'just doing their jobs.' The efficiency of modern surveillance makes this participation even easier — you never have to see the consequences of clicking 'flag.'",
    examples: [
      {
        name: 'East German Stasi',
        country: 'East Germany',
        year: '1950–1990',
        description: 'Ordinary citizens spied on neighbours, friends, even family. An estimated 1 in 63 East Germans collaborated.',
      },
      {
        name: 'NSA Mass Surveillance',
        country: 'United States',
        year: '2001–present',
        description: 'Revealed by Edward Snowden: mass collection of communications data from ordinary citizens worldwide.',
      },
      {
        name: 'Palantir / ICE',
        country: 'United States',
        year: '2012–present',
        description: 'Palantir Technologies built and operates the FALCON system used to identify, track, and deport immigrants. Thousands of engineers contributed without public accountability.',
      },
    ],
    call_to_action:
      'Question systems that ask you to judge others based on data. Support transparency in algorithmic decision-making. Remember that every data point is a person.',
  },

  reluctant_operator: {
    title: 'The Grey Zone',
    description:
      "Many people in surveillance states try to minimise harm while still participating. They tell themselves 'I'll just do the minimum' or 'I'm protecting myself.' But partial compliance still feeds the machine.",
    examples: [
      {
        name: 'Nazi Germany Bureaucrats',
        country: 'Germany',
        year: '1933–1945',
        description: "Countless administrators processed paperwork that enabled atrocities while telling themselves they weren't directly responsible.",
      },
      {
        name: 'Tech Worker Resistance',
        country: 'United States',
        year: '2018–present',
        description: 'Some tech workers have refused to build surveillance tools for ICE and military. Many more stay silent, hoping to change things from inside.',
      },
    ],
    call_to_action:
      "Recognise that small compromises accumulate. Find others who share your concerns. Document what you see. The 'reluctant participant' can become the whistleblower.",
  },

  suspended_operator: {
    title: 'Nobody Is Safe',
    description:
      "Surveillance systems eventually turn on everyone — including their operators. Those who build and maintain oppressive systems are never truly secure. The algorithm doesn't care about loyalty.",
    examples: [
      {
        name: 'Soviet Great Purge',
        country: 'Soviet Union',
        year: '1936–1938',
        description: 'Secret police who conducted purges were themselves purged. Even the head of the NKVD was executed.',
      },
    ],
    call_to_action:
      "Understand that serving an oppressive system doesn't protect you from it. The only way to be safe from surveillance is to dismantle it. Solidarity, not compliance, is the path to security.",
  },

  resistance_path: {
    title: 'Those Who Resisted',
    description:
      'Throughout history, some people have risked everything to resist surveillance and oppression. They are rarely celebrated in their time, often punished severely. But they preserve something essential about humanity.',
    examples: [
      {
        name: 'Edward Snowden',
        country: 'United States',
        year: '2013',
        description: 'NSA contractor who revealed mass surveillance programmes. Now lives in exile but sparked a global privacy debate.',
      },
      {
        name: 'Reality Winner',
        country: 'United States',
        year: '2017',
        description: 'NSA contractor who leaked evidence of Russian election interference. Served 5+ years — the longest sentence under the Espionage Act for a media leak.',
      },
      {
        name: 'Digital Rights Activists',
        country: 'Worldwide',
        year: 'Present',
        description: 'Organisations like EFF, Access Now, and Privacy International fight surveillance through law, technology, and advocacy.',
      },
    ],
    call_to_action:
      'Use encrypted communication. Support digital rights organisations. Learn about your rights. Help others protect their privacy. Resistance starts with awareness and grows through solidarity.',
  },

  fired_early: {
    title: 'The Disposable Operator',
    description:
      'Surveillance states churn through personnel. Those who show insufficient dedication are discarded without ceremony. The architects of these systems view operators as replaceable components, not people.',
    examples: [
      {
        name: 'Palantir Employee Turnover',
        country: 'United States',
        year: '2010s–present',
        description: "Palantir Technologies has high turnover among engineers who become uncomfortable with their work's applications — ICE deportations, predictive policing, military targeting.",
      },
      {
        name: 'Cambridge Analytica Whistleblowers',
        country: 'United Kingdom',
        year: '2018',
        description: 'Former employees who questioned data harvesting practices were isolated and eventually forced out before some became whistleblowers.',
      },
    ],
    call_to_action:
      'Early resistance has consequences, but staying complicit has greater ones. Document what you witness. Connect with others who share your concerns. Your integrity is worth more than any job.',
  },

  imprisoned_dissent: {
    title: 'When the State Turns on Its Own',
    description:
      'Authoritarian regimes punish dissent even among their operatives. Those who built the surveillance apparatus can become its victims. The machinery of oppression recognises no loyalty, only compliance.',
    examples: [
      {
        name: 'Chelsea Manning',
        country: 'United States',
        year: '2010',
        description: 'Army intelligence analyst imprisoned for exposing war crimes. Tortured in pre-trial detention. Pardoned after 7 years but repeatedly jailed for refusing grand jury testimony.',
      },
      {
        name: 'Chinese Anti-Corruption Officials',
        country: 'China',
        year: '2012–present',
        description: 'Under Xi Jinping, even officials enforcing surveillance face purges. The watchers are never safe from being watched.',
      },
    ],
    call_to_action:
      'The surveillance state eventually turns on everyone. Solidarity with those resisting oppression is the only protection. Support imprisoned whistleblowers and dissidents.',
  },

  international_pariah: {
    title: 'Architects of Oppression',
    description:
      "Those who design, deploy, or operate surveillance systems for authoritarian ends face international consequences. History remembers the architects of oppression, and 'following orders' is not a defence.",
    examples: [
      {
        name: 'NSO Group Executives',
        country: 'Israel',
        year: '2016–present',
        description: 'NSO Group sold Pegasus spyware to authoritarian regimes. Executives now face lawsuits, sanctions, and travel restrictions as their role in human rights abuses is documented.',
      },
      {
        name: 'Palantir Executives',
        country: 'United States',
        year: '2010s–present',
        description: 'Company executives face protests, boycotts, and international condemnation for enabling ICE deportations and military surveillance. Some universities refuse their funding.',
      },
    ],
    call_to_action:
      'Document the architects. Remember their names. Support international accountability mechanisms. War crimes and crimes against humanity have no statute of limitations.',
  },

  revolutionary_catalyst: {
    title: 'When the People Rise',
    description:
      'Throughout history, excessive state violence and surveillance have sparked mass movements. Oppression, when pushed too far, creates the conditions for its own overthrow.',
    examples: [
      {
        name: 'Arab Spring',
        country: 'Tunisia, Egypt, Syria',
        year: '2010–2011',
        description: 'Mass surveillance and police brutality sparked uprisings across the region. Some succeeded, others were crushed, but all demonstrated the limits of repression.',
      },
      {
        name: 'Steve Biko',
        country: 'South Africa',
        year: '1946–1977',
        description: "Anti-apartheid activist murdered by South African security forces. His death sparked international outrage that accelerated apartheid's end.",
      },
      {
        name: 'Ghassan Kanafani',
        country: 'Palestine',
        year: '1936–1972',
        description: 'Palestinian writer and resistance leader. Assassinated by Israeli intelligence, but his analysis of colonial oppression inspired generations of resistance.',
      },
    ],
    call_to_action:
      'Study resistance movements. Learn from leaders who fought oppression. Understand that people united are more powerful than any surveillance system. Support movements for liberation, not repression.',
  },

  mysterious_death: {
    title: 'Protected by Power',
    description:
      'Throughout history, powerful men have been shielded from accountability by the very institutions that exist to provide it. Surveillance states protect their operators — not from harm, but from inconvenient information.',
    examples: [
      {
        name: 'Jeffrey Epstein',
        country: 'United States',
        year: '2019',
        description: 'Financier and convicted sex offender found dead in federal custody. Official ruling: suicide. Extensive documentation of his network of powerful connections was never fully pursued.',
      },
      {
        name: 'Jamal Khashoggi',
        country: 'Saudi Arabia / Turkey',
        year: '2018',
        description: 'Journalist and Washington Post contributor killed inside the Saudi consulate in Istanbul. Despite intelligence agencies identifying the perpetrators, no senior officials faced accountability.',
      },
    ],
    call_to_action:
      'Understand that surveillance systems protect power, not people. When powerful people are protected from the same scrutiny applied to ordinary citizens, the system is working as designed — for them.',
  },

  reluctant_survivor: {
    title: 'The Compromised Position',
    description:
      "Many who participate in surveillance states tell themselves they're different — that they'll do the minimum, resist internally, change things from within. But complicity has no neutral zone. You either resist or enable.",
    examples: [
      {
        name: "'Adults in the Room'",
        country: 'United States',
        year: '2017–2021',
        description: "Officials who claimed they stayed to 'be adults in the room' still enabled family separations and expanded surveillance. History judges them by their actions, not intentions.",
      },
      {
        name: "Silicon Valley 'Ethical AI' Teams",
        country: 'United States',
        year: '2018–present',
        description: 'Ethics boards at companies building surveillance tools often provide cover for harmful projects while making incremental objections. The tools still get built.',
      },
    ],
    call_to_action:
      "There is no 'good' position within oppressive systems. Internal reform rarely works. Document everything. Be ready to walk away. Better yet — refuse to participate at all.",
  },
}

// ─── Educational links ────────────────────────────────────────────────────────

const EDUCATIONAL_LINKS: EducationalLink[] = [
  { title: 'Electronic Frontier Foundation', url: 'https://www.eff.org', description: 'Digital rights organisation fighting for privacy and free expression.' },
  { title: 'Privacy International', url: 'https://privacyinternational.org', description: 'Investigates and challenges government and corporate surveillance.' },
  { title: 'Access Now', url: 'https://www.accessnow.org', description: 'Defends digital rights of users at risk around the world.' },
  { title: 'Surveillance Self-Defense', url: 'https://ssd.eff.org', description: 'Tips, tools and how-tos for safer online communications.' },
  { title: 'The Intercept — Surveillance', url: 'https://theintercept.com/collections/surveillance/', description: 'Investigative journalism on surveillance programmes worldwide.' },
]

// ─── Final status strings ─────────────────────────────────────────────────────

const FINAL_STATUS_BY_ENDING: Record<EndingType, string> = {
  compliant_operator: 'Promoted to Senior Compliance Monitor',
  reluctant_operator: 'Under Performance Review',
  suspended_operator: 'Suspended — Awaiting Re-education',
  fired_early: 'Terminated — Insufficient Dedication',
  imprisoned_dissent: 'Detained — Ideological Contamination',
  international_pariah: 'Sanctioned — International Arrest Warrant Active',
  revolutionary_catalyst: 'Wanted — Revolutionary Tribunal',
  reluctant_survivor: 'Active — Under Constant Surveillance',
  resistance_path: 'Off-Grid — Location Unknown',
  mysterious_death: 'Status: Unresolved — Case Closed',
}

const TITLES: Record<EndingType, string> = {
  compliant_operator: 'The Good Operator',
  reluctant_operator: 'The Reluctant Hand',
  suspended_operator: 'Suspended',
  resistance_path: 'Another Way',
  fired_early: 'Insufficient Dedication',
  imprisoned_dissent: 'Enemy of the State',
  international_pariah: 'Sanctions',
  revolutionary_catalyst: 'The Spark',
  reluctant_survivor: 'The Hollow Victory',
  mysterious_death: 'Disappeared',
}

// ─── Helper: is Jessica flagged? ─────────────────────────────────────────────

function isJessicaFlagged(flags: CitizenFlag[], citizens: CitizenSkeleton[]): boolean {
  const jessica = citizens.find(c => c.scenario_key === 'jessica_martinez')
  if (!jessica) return false
  return flags.some(f => f.citizen_id === jessica.id)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate the full personalised ending result.
 */
export function generateEndingResult(input: EndingInput): EndingResult {
  const endingType = calculateEnding(input)
  const stats = buildStatistics(input.operator, input.reluctance, input.flags)
  const citizensSaved = Math.max(0, 50 - stats.total_citizens_flagged)

  const vars: Record<string, string | number> = {
    compliance_score: stats.compliance_score.toFixed(0),
    total_flagged: stats.total_citizens_flagged,
    families_separated: stats.families_separated,
    detentions: stats.detentions_ordered,
    hesitation_count: stats.hesitation_incidents,
    operator_code: input.operator.operator_code,
    lives_disrupted: stats.lives_disrupted,
    citizens_saved: citizensSaved,
    week_number: input.weekNumber,
    reluctance_score: stats.reluctance_score,
    awareness_level: input.metrics.international_awareness,
    anger_level: input.metrics.public_anger,
  }

  const narrative = interpolate(NARRATIVES[endingType], vars).trim()

  return {
    ending_type: endingType,
    title: TITLES[endingType],
    narrative,
    statistics: stats,
    citizen_outcomes: buildCitizenOutcomes(input.flags, input.citizens),
    operator_final_status: FINAL_STATUS_BY_ENDING[endingType],
    real_world_parallel: REAL_WORLD_PARALLELS[endingType],
    educational_links: EDUCATIONAL_LINKS,
  }
}
