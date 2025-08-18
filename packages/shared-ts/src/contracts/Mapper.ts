/**
 * Bidirectional mapper between domain entities and DTOs.
 */
export interface Mapper<Domain, DTO> {
  /**
   * Converts a domain entity into a transport-friendly DTO.
   * @param input Domain entity.
   */
  toDTO(input: Domain): DTO;

  /**
   * Converts a transport DTO into a domain entity.
   * @param input Transport DTO.
   */
  fromDTO(input: DTO): Domain;
}

/**
 * Partial mapping contract for asymmetric translations.
 */
export type PartialMapper<Domain, DTO> = Partial<Mapper<Domain, DTO>>;
