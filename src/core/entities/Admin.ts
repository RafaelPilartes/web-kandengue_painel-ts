import type { FirestoreDataConverter } from 'firebase/firestore'
import type { AdminInterface } from '@/interfaces/IAdmin'
import type { AdminRole } from '@/types/enum'
import type { OptionType } from '@/types/option'
import { UserEntity } from './User'
import type { UserDoc } from './User'
import { toDate } from '@/helpers/firestore'

/** `id` sempre presente — ver o comentário equivalente em `UserEntityParams`. */
export type AdminEntityParams = Omit<AdminInterface, 'id'> & { id: string }

export class AdminEntity extends UserEntity implements AdminInterface {
  role: AdminRole
  permissions: OptionType[]

  constructor(params: AdminEntityParams) {
    super(params)
    this.role = params.role
    this.permissions = params.permissions
  }
}

/**
 * Forma CRUA do documento em `admins`. As datas (`created_at`, `updated_at`,
 * `last_login`) vêm de `UserEntity` — `AdminEntity` não declara nenhuma data
 * própria, mas o converter tem de as converter na mesma.
 */
export interface AdminDoc extends Omit<UserDoc, 'id'> {
  id?: string
  role?: AdminRole
  permissions?: OptionType[]
}

/** Fronteira única entre o documento Firestore e a aplicação. */
export const adminConverter: FirestoreDataConverter<AdminEntity> = {
  toFirestore(admin) {
    return { ...admin }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as AdminDoc
    return new AdminEntity({
      ...d,
      id: snapshot.id,
      permissions: d.permissions ?? [],
      // Datas herdadas de `UserEntity` — a armadilha desta task.
      created_at: toDate(d.created_at) ?? undefined,
      updated_at: toDate(d.updated_at) ?? undefined,
      last_login: toDate(d.last_login) ?? undefined
    } as AdminEntityParams)
  }
}
