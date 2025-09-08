import type { IUserRepository } from '@/core/interfaces/IUserRepository'
import { FirebaseUserDAO } from './firebase/users.dao'
import type { IAdminRepository } from '@/core/interfaces/IAdminRepository'
import { FirebaseAdminDAO } from './firebase/admins.dao'
// import { RestUserDAO } from "./rest/users.dao"; // Futuro

// Factory para escolher implementação
export const userRepository: IUserRepository = new FirebaseUserDAO()
export const adminRepository: IAdminRepository = new FirebaseAdminDAO()
