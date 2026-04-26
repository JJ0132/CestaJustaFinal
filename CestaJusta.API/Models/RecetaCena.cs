using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CestaJusta.API.Models
{
    [Table("Recetas_Cena")]
    public class RecetaCena
    {
        [Key]
        [JsonPropertyName("IdCena")]
        public int Id { get; set; }

        [Required]
        [JsonPropertyName("NombreCena")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("Precio_Cena")]
        public decimal Precio { get; set; }

        public bool EsVegetariano { get; set; }
    }
}
