import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestUser {
  email: string
  password: string
  nombre: string
  rol: 'asistente' | 'salon' | 'cliente'
}

const testUsers: TestUser[] = [
  {
    email: 'asistente@pickevent.test',
    password: 'Asistente123!',
    nombre: 'Juan Pérez - Asistente',
    rol: 'asistente'
  },
  {
    email: 'salon@pickevent.test',
    password: 'Salon123!',
    nombre: 'Salón Las Rosas',
    rol: 'salon'
  },
  {
    email: 'cliente@pickevent.test',
    password: 'Cliente123!',
    nombre: 'María González - Cliente',
    rol: 'cliente'
  }
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const results: { email: string; success: boolean; error?: string; userId?: string }[] = []

    for (const user of testUsers) {
      console.log(`Creating user: ${user.email}`)

      // Create user using Admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          nombre: user.nombre
        }
      })

      if (authError) {
        console.error(`Error creating ${user.email}:`, authError.message)
        
        // If user already exists, try to get their ID and update role
        if (authError.message.includes('already been registered')) {
          const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
          const existingUser = existingUsers?.users?.find(u => u.email === user.email)
          
          if (existingUser) {
            // Update the profile role
            const { error: updateError } = await supabaseAdmin
              .from('profiles')
              .update({ rol: user.rol, nombre: user.nombre })
              .eq('id', existingUser.id)

            results.push({
              email: user.email,
              success: !updateError,
              error: updateError?.message,
              userId: existingUser.id
            })
            continue
          }
        }

        results.push({
          email: user.email,
          success: false,
          error: authError.message
        })
        continue
      }

      if (authData.user) {
        console.log(`User created: ${authData.user.id}`)

        // Update the profile with the correct role
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ rol: user.rol })
          .eq('id', authData.user.id)

        if (profileError) {
          console.error(`Error updating profile for ${user.email}:`, profileError.message)
        }

        results.push({
          email: user.email,
          success: true,
          userId: authData.user.id
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test users processed',
        results,
        credentials: testUsers.map(u => ({
          email: u.email,
          password: u.password,
          rol: u.rol
        }))
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error:', errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
