using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CestaJusta.API.Models
{
    [Table("Recetas_Desayuno")]
    public class RecetaDesayuno
    {
        [Key]
        [JsonPropertyName("IdDesayuno")]
        public int Id { get; set; }

        [Required]
        [JsonPropertyName("NombreDesayuno")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("Precio_Desayuno")]
        public decimal Precio { get; set; }

        public bool EsVegetariano { get; set; }
    }
}
