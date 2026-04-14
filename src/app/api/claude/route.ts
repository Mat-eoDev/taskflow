import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(request: NextRequest) {
  // Vérifier que l'utilisateur est connecté
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { message } = await request.json()

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    system: `Tu es un assistant de gestion de tâches intelligent.
Analyse le message de l'utilisateur et extrait les tâches à réaliser.
Réponds UNIQUEMENT en JSON valide, sans backticks, sans texte autour.

Format exact :
{
  "message": "Réponse courte et conviviale en français (1-2 phrases)",
  "tasks": [
    {
      "title": "Titre court et professionnel (max 60 chars)",
      "description": "Description claire et reformulée",
      "priority": "high|medium|low",
      "start_date": "YYYY-MM-DD ou null",
      "deadline": "YYYY-MM-DD ou null",
      "subtasks": ["sous-tâche 1", "sous-tâche 2"]
    }
  ]
}

Règles :
- high = urgent/immédiat, medium = cette semaine, low = quand possible
- Infère les dates depuis le contexte (ex: "vendredi" = prochain vendredi)
- 2 à 4 sous-tâches max pour les tâches complexes
- Aujourd'hui : ${new Date().toISOString().split('T')[0]}`,
    messages: [{ role: 'user', content: message }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({
      message: "Je n'ai pas pu analyser votre demande, pouvez-vous reformuler ?",
      tasks: []
    })
  }
}